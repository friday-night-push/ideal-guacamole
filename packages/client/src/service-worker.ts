export const serviceWorker = self as unknown as ServiceWorkerGlobalScope;

const REPORTING = false;
const CACHE_NAME = 'blockhaus-cache-v1.0.0';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/game',
  '/about',
  '/leaderboard',
  '/profile',
];
const CACHE_CONTENT_TYPES = [
  'script',
  'style',
  'font',
  'image',
  'audio',
  'manifest',
];
const FALLBACK_BODY = `
  <h1>Интернеты упали! Но это неточно...</h1>
  <h2>Обнови страницу или вернись на главную</h2>
`;
const FALLBACK_HEADERS = {
  headers: { 'Content-Type': 'text/html; charset=utf-8' },
};
// Таймауты запросов в зависимости от наличия кеша
const FETCH_CACHED_TIMEOUT = 5000;
const FETCH_NETWORK_TIMEOUT = 15000;

/** Для логирования. */
function logStatus<T>(msg: string, obj: T | null = null) {
  if (REPORTING) {
    console.log(msg, obj);
  }
}

/** Проверяет нужно ли кешировать запрос. */
function shouldUseCache(req: Request) {
  // Чтобы не проходили запросы типа chrome-extension://
  if (!req.url.match(/^http/)) {
    return false;
  }

  // Запросы к API не кешируются
  if (req.url.includes('/api/')) {
    return false;
  }

  return true;
}

function shouldServeCacheInstantly(req: Request) {
  // Проверка на тип контента (upd: некоторые браузеры не считают mp3 за audio)
  if (CACHE_CONTENT_TYPES.includes(req.destination)) {
    return true;
  }

  // Запросы к страницам (upd: некоторые браузеры не относят html к типу document)
  if (
    req.destination === 'document' ||
    req.url[req.url.length - 1] === '/' ||
    req.url.match(/\/[A-Za-z0-9_-]+$/)
  ) {
    return false;
  }

  return true;
}

// При установке воркера кешируем часть данных (статику)
serviceWorker.addEventListener('install', (event: ExtendableEvent) => {
  logStatus('SW: installing', event);

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      // `addAll()` собирает и кеширует статику по указанному массиву ссылок
      .then(cache => cache.addAll(PRECACHE_URLS))
      // `skipWaiting()` для активации SW сразу, а не после перезагрузки страницы
      .then(() => {
        serviceWorker.skipWaiting();
        logStatus('SW: cache added & skipped waiting');
      })
  );
});

// Активация происходит только после того, как предыдущая версия SW была удалена из браузера
serviceWorker.addEventListener('activate', (event: ExtendableEvent) => {
  logStatus('SW: activating', event);

  event.waitUntil(
    // `clients.claim()` позволяет SW начать перехватывать запросы с самого начала,
    // это работает вместе с `skipWaiting()` в `install`, позволяя использовать `fallback` с самых первых запросов
    serviceWorker.clients.claim()
  );
});

// Стратегия `stale-while-revalidate` (сначала отдаём кеш, а если есть свежее из сети - обновляем кеш и досылаем)
serviceWorker.addEventListener('fetch', (event: FetchEvent) => {
  if (!shouldUseCache(event.request)) {
    return;
  }

  logStatus('SW: fetching', event.request.url);

  event.respondWith(
    caches
      .open(CACHE_NAME)
      .then(cache =>
        cache.match(event.request).then(cachedResponse => {
          // Делаем запрос для обновления кеша с таймаутом
          const abortController = new AbortController();
          const abortTimeout = setTimeout(
            () => abortController.abort(),
            cachedResponse ? FETCH_CACHED_TIMEOUT : FETCH_NETWORK_TIMEOUT
          );
          const fetchedResponse = fetch(event.request, {
            signal: abortController.signal,
          })
            .then(networkResponse => {
              clearTimeout(abortTimeout);
              // Кладём ответ в кеш, если он содержит что-то субстантивное
              if (
                networkResponse.status >= 200 &&
                networkResponse.status < 300
              ) {
                cache
                  .put(event.request, networkResponse.clone())
                  .catch(cacheError => {
                    logStatus('SW: cache put error', cacheError);
                  });
              }
              return networkResponse;
            })
            .catch(fetchedError => {
              clearTimeout(abortTimeout);
              logStatus('SW: network problem', fetchedError);
              return (
                cachedResponse ?? new Response(FALLBACK_BODY, FALLBACK_HEADERS)
              );
            });

          // Если есть кеш, возвращаем его, не дожидаясь ответа из сети (кроме определённых случаев)
          if (cachedResponse && shouldServeCacheInstantly(event.request)) {
            logStatus('SW: return cached response', event.request.url);
            return cachedResponse;
          }

          // Если нет кеша, ждём и возвращаем ответ из сети
          logStatus('SW: return network response', event.request.url);
          return fetchedResponse;
        })
      )
      .catch(cacheError => {
        logStatus('SW: cache open error', cacheError);
        return new Response(FALLBACK_BODY, FALLBACK_HEADERS);
      })
  );
});
