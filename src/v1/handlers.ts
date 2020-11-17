import root from './path/root';
import download from './path/public.download';
import data from './path/public.data';
import search from './path/public.search';
import privateCreateUpdateDelete from './path/private';
import privateDownload from './path/private.download';
import privateSearch from './path/private.search';

export default {
  ...root,
  ...download,
  ...data,
  ...search,
  ...privateCreateUpdateDelete,
  ...privateDownload,
  ...privateSearch,
}