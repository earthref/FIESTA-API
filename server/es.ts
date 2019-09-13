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
    hits: Array<{
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
    }>;
  };
  aggregations?: any;
  err?: Explanation;
}

// Check the ES connection status
async function esCheckConnection() {
  let isConnected = false;
  while (!isConnected) {
    // console.log('Connecting to ES');
    try {
      const health = await client.cluster.health({});
      console.log(health);
      isConnected = true;
    } catch (err) {
      // console.log('Connection Failed, Retrying...', err);
    }
  }
  return isConnected;
}
export { esCheckConnection };

// Search public contributions
async function esGetSearchByTable(
  { table = 'contribution', size = 10, from = 0, query = '' }:
  { table?: string, size?: number, from?: number, query?: string } = {},
) {
  const params: RequestParams.Search = {
    index,
    type: table,
    size,
    from,
    body: {
      sort: {
        'summary.contribution.timestamp': 'desc',
      },
      query: {
        bool: {
          must: [query && {
            simple_query_string: {
              query,
            },
          } || true, {
            term: {
              'summary.contribution._is_activated': true,
            },
          }],
        },
      },
    },
  };

  const resp: ApiResponse<SearchResponse> = await client.search(params);
  if (resp.body.hits.total <= 0) { return undefined; }
  const results = table !== 'contribution' ?
    resp.body.hits.hits.map((hit) => hit._source.rows) :
    resp.body.hits.hits.map((hit) =>
      [_.omitBy(hit._source.summary.contribution, (_: any, k: string) => k[0] === '_')]);
  return {
    total: resp.body.hits.total,
    size,
    from,
    query,
    results,
  };
}
export { esGetSearchByTable };
