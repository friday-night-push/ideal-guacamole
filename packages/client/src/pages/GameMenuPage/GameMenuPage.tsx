import { useEffect } from 'react';

import { Menu, Skeleton } from '@gravity-ui/uikit';

import { useNavigate, useSearchParams } from 'react-router-dom';

import { Container } from 'src/components/atoms/Container';
import { Logo } from 'src/components/atoms/Logo';
import type { MenuItemProps } from 'src/components/atoms/MenuItem';
import { MenuItem } from 'src/components/atoms/MenuItem';
import { Copyright } from 'src/components/molecules/Copyright';
import { User } from 'src/components/molecules/User';
import { Geolocation } from 'src/components/organisms';
import { Page } from 'src/components/organisms/Page';

import { setGameType, useAppDispatch } from 'src/store';
import { useGetUserQuery, useYaSignInUpMutation } from 'src/store/features';
import { PAGE_ROUTES } from 'src/utils/constants';

export const GameMenuPage = () => {
  const { data: user, isLoading } = useGetUserQuery();
  const [yaSignInUp] = useYaSignInUpMutation();

  const [searchParams, setSearchParams] = useSearchParams();

  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const goGame = (gameType: number) => {
    dispatch(setGameType(gameType));
    navigate(PAGE_ROUTES.GAME_DIFFICULT);
  };

  const MENU_ITEMS: MenuItemProps[] = [
    { label: 'never-ending', onClick: () => goGame(0) },
    { label: 'race the clock', onClick: () => goGame(1) },
    { label: 'leaderboards', href: PAGE_ROUTES.LEADER_BOARD },
    { label: 'forum', href: PAGE_ROUTES.FORUM },
  ];

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      yaSignInUp(code);
      setSearchParams('');
    }
  }, []);

  return (
    <Page>
      <Logo isFull size='auto' />
      <Menu size='xl'>
        <Container direction='column' alignItems='center'>
          {isLoading ? (
            <Skeleton style={{ height: '50px' }} qa='skeleton' />
          ) : user && user.id ? (
            <Container direction='column' gap={2} alignItems='center'>
              <User isFullSize />
              <Geolocation />
            </Container>
          ) : (
            <MenuItem label='sign in' onClick={() => navigate(PAGE_ROUTES.SIGN_IN)} />
          )}
          {MENU_ITEMS.map(item => (
            <MenuItem key={item.label} {...item} />
          ))}
        </Container>
      </Menu>
      <Copyright />
    </Page>
  );
};
