import lodash from 'lodash';
import deepdash from 'deepdash';
import bcrypt from 'bcryptjs';
import { Client, ApiResponse } from '@opensearch-project/opensearch';

const _ = deepdash(lodash);

const usersIndex = 'er_users';
const client = new Client({
    node: process.env.OS_NODE,
});

function sleep(ms = 0) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms, '');
	});
}

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

interface Hit {
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
}

interface SearchResponse {
	took: number;
	timed_out: boolean;
	_scroll_id?: string;
	_shards: ShardsResponse;
	hits: {
		total: {
			value: number;
		}
		max_score: number;
		hits: Hit[];
	};
	aggregations?: any;
	err?: Explanation;
}

// Check the ES connection status
async function esCheckConnection(attempt = 0): Promise<boolean> {
	try {
		const health = await client.cluster.health({});
		return (
			health &&
			health.body &&
			(health.body.status === 'yellow' || health.body.status === 'green')
		);
	} catch (err) {
		if (process.env.NODE_ENV === 'development') {
			console.log('Connecting to ES Failed, Retrying...', err);
		}
	}
	if (attempt >= 5) {
		return false;
	}
	await sleep(100);
	return esCheckConnection(attempt + 1);
}
export { esCheckConnection };

// Authenticate a username and password
async function esAuthenticate(authorization: string): Promise<boolean | any> {
	const b64auth = (authorization || '').split(' ')[1] || '';
	const [username, password] = Buffer.from(b64auth, 'base64')
		.toString()
		.split(':');
	const resp: ApiResponse<SearchResponse> = await client.search({
		size: 1,
		index: usersIndex,
		body: {
			query: { term: { 'handle.raw': username.toLowerCase() } },
			sort: { id: 'desc' },
		},
	});
	if (resp.body.hits.total.value <= 0) {
		await sleep(500);
		return false;
	}
	let user = resp.body.hits.hits[0]._source;
	if (!bcrypt.compareSync(password, user._password)) {
		await sleep(500);
		return false;
	}
	user = _.omitDeep(user, /(^|\.)_/);
	user.has_password = true;
	return user;
}
export { esAuthenticate };
