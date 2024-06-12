const { username, token } = require('./PAT.js');

// Function to fetch paginated data from GitHub API with authentication
async function fetchGitHubData(url, token) {
    let results = [];
    let page = 1;
    const perPage = 100; // Maximum allowed by GitHub API

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

// Function to fetch GitHub followers and following based on username
async function fetchGitHubFollowersAndFollowing(username, token) {
    const [followers, following] = await Promise.all([
        fetchGitHubData(`https://api.github.com/users/${username}/followers`, token),
        fetchGitHubData(`https://api.github.com/users/${username}/following`, token)
    ]);
    
    console.log(`Fetched ${followers.length} followers and ${following.length} following for user ${username}`);
    
    return { followers, following };
}

// Function to compare followers and following lists
async function compareFollowersAndFollowing(username, token) {
    console.log(`Comparing followers and following lists for user ${username}`);
    const { followers, following } = await fetchGitHubFollowersAndFollowing(username, token);

    const followersSet = new Set(followers.map(follower => follower.login));
    const followingSet = new Set(following.map(user => user.login));

    const notFollowingBack = Array.from(followingSet).filter(user => !followersSet.has(user));
    const notFollowedBack = Array.from(followersSet).filter(user => !followingSet.has(user));

    return { notFollowingBack, notFollowedBack };
}

// Function to display results in the HTML
function displayResults(username, notFollowingBack, notFollowedBack) {
    document.getElementById('username').textContent = username;
    document.getElementById('username-following').textContent = username;
    document.getElementById('username-followers').textContent = username;

    const notFollowingBackList = document.getElementById('notFollowingBackList');
    notFollowingBackList.innerHTML = '';
    notFollowingBack.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user;
        notFollowingBackList.appendChild(li);
    });

    const notFollowedBackList = document.getElementById('notFollowedBackList');
    notFollowedBackList.innerHTML = '';
    notFollowedBack.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user;
        notFollowedBackList.appendChild(li);
    });
}

// Example usage
compareFollowersAndFollowing(username, token)
    .then(({ notFollowingBack, notFollowedBack }) => {
        console.log(`Users followed by ${username} but not following back:`);
        notFollowingBack.forEach(user => {
            console.log(user);
        });

        console.log(`Users following ${username} but not followed back:`);
        notFollowedBack.forEach(user => {
            console.log(user);
        });

        displayResults(username, notFollowingBack, notFollowedBack);
    })
    .catch(error => {
        console.error("An error occurred:", error);
    });
