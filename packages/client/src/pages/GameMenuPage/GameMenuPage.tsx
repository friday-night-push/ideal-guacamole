import { useContext } from 'react';

import { Menu } from '@gravity-ui/uikit';

import { useNavigate } from 'react-router-dom';

import {
  Container,
  Copyright,
  Logo,
  MenuItem,
  MenuItemProps,
  Page,
  User,
} from 'src/components';

import { AuthContext } from 'src/hoc';
import { PAGE_ROUTES } from 'src/utils/constants';

const MENU_ITEMS: MenuItemProps[] = [
  { label: 'play the endless game', href: PAGE_ROUTES.GAME },
  { label: 'play for time', href: PAGE_ROUTES.GAME },
  {
    label: 'leaderboards',
    href: PAGE_ROUTES.LEADER_BOARD,
  },
];

export const GameMenuPage = () => {
  const { user, setUser, userIsLoading } = useContext(AuthContext);

  const navigate = useNavigate();

  return (
    <Page>
      <Logo isFull size="auto" />
      <Menu size={'xl'}>
        <Container direction={'column'} alignItems={'center'}>
          {user && user.id ? (
            <User
              user={user}
              setUser={setUser}
              userIsLoading={userIsLoading}
              isFullSize
            />
          ) : (
            <MenuItem
              label={'sign in'}
              onClick={() => navigate(PAGE_ROUTES.SIGN_IN)}
            />
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
