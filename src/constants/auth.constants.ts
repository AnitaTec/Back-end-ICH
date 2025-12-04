export const passwordRegexp: RegExp = /^(?=.*[A-Za-z])(?=.*\d).+$/;

export const emailRegexp: RegExp =
  /^(?!\.)(?!.*\.\.)([a-z0-9_'+\-\.]*)[a-z0-9_+-]@([a-z0-9][a-z0-9\-]*\.)+[a-z]{2,}$/i;
