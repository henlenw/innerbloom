import type { Env } from '../../server/types';
import { handleApi } from '../../server/api';
export const onRequest = (context:{request:Request;env:Env}) => handleApi(context.request,context.env);
