import * as dotenv from 'dotenv';
dotenv.config();

import { API } from './api';
API.listen(process.env.API_PORT);

import { Docs } from './docs';
Docs.listen(process.env.DOCS_PORT);
