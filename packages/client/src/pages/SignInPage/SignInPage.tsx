import React, { useContext, useState } from 'react';

import { Text } from '@gravity-ui/uikit';
import { Navigate, useNavigate } from 'react-router-dom';

import { Button } from 'src/components/atoms/Button';
import { Container } from 'src/components/atoms/Container';
import { Logo } from 'src/components/atoms/Logo';
import { Form } from 'src/components/molecules/Form';
import { Page } from 'src/components/organisms/Page';
import { authAPI, AuthContext } from 'src/hoc/AuthProvider';
import type { TSignInRequest, TUser } from 'src/shared/types/user';
import type { TYandex } from 'src/shared/types/yandex';

import { PAGE_ROUTES } from 'src/utils/constants';
import Helpers from 'src/utils/helpers';

import { inputs, validationSchema } from './SignInPage.constants';

export const SignInPage: React.FC = () => {
  const { user, setUser, userIsLoading } = useContext(AuthContext);
  const [error, setError] = useState<string | undefined>(undefined);

  const navigate = useNavigate();

  const auth = async (formData: TSignInRequest) => {
    await authAPI.signin(formData, isOk, errorHandler);
  };

  const isOk = (response: Response) => {
    if (response.ok) {
      authAPI.getuser(updUserData, errorHandler);
    }
  };

  const updUserData = (user: TUser) => {
    if (setUser) {
      setUser(user);
    }
  };

  const errorHandler = (err: Error) => {
    setError(String(err));
    Helpers.Log('ERROR', err);
  };

  const goToSignUp = () => {
    navigate(PAGE_ROUTES.SIGN_UP);
  };

  const isGetIdOk = (data: TYandex) => {
    const url = `https://oauth.yandex.ru/authorize?response_type=code&client_id=${data.service_id}&redirect_uri=http://localhost:3000`;
    window.location.href = url;
  };

  const goToYandex = async () => {
    await authAPI.yaGetServiceId(isGetIdOk, errorHandler);
  };

  const goBack = () => {
    navigate(-1);
  };

  return (
    <Page>
      {!user?.id && !userIsLoading ? (
        <>
          <Logo size="sm" />
          <Container direction="column" alignItems="center">
            <Text variant="display-2">Sign in</Text>
            <Text variant="subheader-2" style={{ textAlign: 'center' }}>
              Back again? Just sign in to keep your results showing up on the
              leaderboards
            </Text>
          </Container>
          <Form
            inputs={inputs}
            validationSchema={validationSchema}
            onSubmit={auth}
            errorMessage={error}
          />
          <Button view="outlined-info" onClick={goToYandex}>
            Sign in or sign up through Yandex
          </Button>
          <Button view="flat" onClick={goToSignUp}>
            First time here? Sign up
          </Button>
          <Button view="flat" onClick={goBack}>
            Back
          </Button>
        </>
      ) : (
        <Navigate to={PAGE_ROUTES.MENU} />
      )}
    </Page>
  );
};
