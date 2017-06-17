const compareVersions: any = require('compare-versions');

interface Response {
  json(): any;
  status: number;
  statusText: string;
}

const endpoint = 'https://api.github.com';

function checkStatus(response: Response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    throw new Error(response.statusText);
  }
}

export function fetchVersions(repo: string) {
  return fetch(`${endpoint}/repos/ant-design/${repo}/releases`)
    .then(checkStatus)
    .then((response: Response) => response.json())
    .then(releases => releases.map((r: any) => r.tag_name))
    .then(versions =>
      versions.sort((a: string, b: string) => -compareVersions(a, b))
    );
}

export function fetchIssues(repo: string, keyword: string) {
  const q = encodeURIComponent(`is:issue repo:ant-design/${repo} ${keyword}`);
  return fetch(`${endpoint}/search/issues?q=${q}&per_page=5`)
    .then(checkStatus)
    .then((response: Response) => response.json())
    .then(json => json.items);
}
