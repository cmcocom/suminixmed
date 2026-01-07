import { authOptions } from './auth';

export const jwt = authOptions.callbacks.jwt as any;
export const session = authOptions.callbacks.session as any;
