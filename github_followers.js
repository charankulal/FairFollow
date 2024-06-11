const { username, token } =require('./PAT.js')
// Function to fetch paginated data from GitHub API with authentication
async function fetchGitHubData(url, token) {
  let results = [];
  let page = 1;
  let perPage = 100; // Maximum allowed by GitHub API

  const headers = new Headers({
    Authorization: `token ${token}`,
  });

  while (true) {
    console.log(`Fetching page ${page} of ${url}`);
    const response = await fetch(`${url}?per_page=${perPage}&page=${page}`, {
      headers,
    });

    if (!response.ok) {
      console.error(
        `Error fetching page ${page}: ${response.status} ${response.statusText}`
      );
      console.error("Rate limit info:", {
        "X-RateLimit-Limit": response.headers.get("X-RateLimit-Limit"),
        "X-RateLimit-Remaining": response.headers.get("X-RateLimit-Remaining"),
        "X-RateLimit-Reset": response.headers.get("X-RateLimit-Reset"),
      });
      return results; // Return what we have so far
    }

    const data = await response.json();
    results = results.concat(data);

    if (data.length < perPage) {
      break;
    }

    page++;
  }

  return results;
}

// Function to fetch GitHub followers based on username
async function fetchGitHubFollowers(username, token) {
  const url = `https://api.github.com/users/${username}/followers`;
  const followers = await fetchGitHubData(url, token);
  console.log(`Fetched ${followers.length} followers for user ${username}`);
  return followers;
}

// Function to fetch GitHub following list based on username
async function fetchGitHubFollowing(username, token) {
  const url = `https://api.github.com/users/${username}/following`;
  const following = await fetchGitHubData(url, token);
  console.log(`Fetched ${following.length} following for user ${username}`);
  return following;
}

// Function to compare followers and following lists
async function compareFollowersAndFollowing(username, token) {
  console.log(`Comparing followers and following lists for user ${username}`);
  const followers = await fetchGitHubFollowers(username, token);
  const following = await fetchGitHubFollowing(username, token);

  const followersSet = new Set(followers.map((follower) => follower.login));
  const followingSet = new Set(following.map((user) => user.login));

  const notFollowingBack = Array.from(followingSet).filter(
    (user) => !followersSet.has(user)
  );
  const notFollowedBack = Array.from(followersSet).filter(
    (user) => !followingSet.has(user)
  );

  return { notFollowingBack, notFollowedBack };
}

// Example usage

compareFollowersAndFollowing(username, token)
  .then(({ notFollowingBack, notFollowedBack }) => {
    console.log(`Users followed by ${username} but not following back:`);
    notFollowingBack.forEach((user) => {
      console.log(user);
    });

    console.log(`Users following ${username} but not followed back:`);
    notFollowedBack.forEach((user) => {
      console.log(user);
    });
  })
  .catch((error) => {
    console.error("An error occurred:", error);
  });
