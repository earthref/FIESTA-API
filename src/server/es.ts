/* eslint-disable camelcase */
/* eslint-disable no-underscore-dangle */

import _ from 'lodash';
import { Client, RequestParams, ApiResponse } from '@elastic/elasticsearch';

const index = 'magic_v4';
const client = new Client({ node: process.env.ES_NODE });

// Complete definition of the Search response
interface ShardsResponse {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
}

interface Explanation {
  value: number;
  description: string;
  details: Explanation[];
}

interface SearchResponse {
  took: number;
  timed_out: boolean;
  _scroll_id?: string;
  _shards: ShardsResponse;
  hits: {
    total: number;
    max_score: number;
    hits: {
      _index: string;
      _type: string;
      _id: string;
      _score: number;
      _source: any;
      _version?: number;
      _explanation?: Explanation;
      fields?: any;
      highlight?: any;
      inner_hits?: any;
      matched_queries?: string[];
      sort?: string[];
    }[];
  };
  aggregations?: any;
  err?: Explanation;
}

// Check the ES connection status
function sleep(ms = 0) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
async function esCheckConnection(attempt = 0): Promise<boolean> {
  try {
    const health = await client.cluster.health({});
    if (process.env.NODE_ENV === 'development') { console.log(health); }
    return true;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') { console.log('Connecting to ES Failed, Retrying...', err); }
  }
  if (attempt >= 5) { return false; }
  await sleep(100);
  return esCheckConnection(attempt + 1);
}
export { esCheckConnection };

// Search public contributions
async function esGetSearchByTable(
  { table = 'contribution', size = 10, from = 0, queries = [], ids = [], dois = [] }:
  { table?: string, size?: number, from?: number, queries?: string[], ids?: string[], dois?: string[] } = {},
) {
  const must:{}[] = [{ term: { 'summary.contribution._is_activated': true }}];
  if (queries.length) queries.forEach(query => must.push({ query_string: { query }}));
  if (ids.length) must.push({ terms: { 'summary.contribution.id': ids }});
  if (dois.length) must.push({ terms: { 'summary.contribution._reference.doi.raw': dois }});
  const params: RequestParams.Search = {
    index,
    type: table,
    size,
    from,
    body: {
      sort: { 'summary.contribution.timestamp': 'desc' },
      query: { bool: { must } },
    },
  };
  const resp: ApiResponse<SearchResponse> = await client.search(params);
  if (resp.body.hits.total <= 0) { return false; }
  const results = table !== 'contribution' ?
    _.flatMap(resp.body.hits.hits, (hit) => hit._source.rows) :
    resp.body.hits.hits.map((hit) =>
      _.omitBy(hit._source.summary.contribution, (o: any, k: string) => k[0] === '_'));
  return {
    total: resp.body.hits.total,
    table,
    size,
    from,
    queries,
    results,
  };
}
export { esGetSearchByTable };
