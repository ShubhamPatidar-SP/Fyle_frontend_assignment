// Function to handle Enter key press
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        fetchGitHubData();
    }
}

// Function to extract page number from Link header
function getPageNumber(linkHeader, relValue) {
    const relIndex = linkHeader.indexOf(relValue);
    const relSubstring = linkHeader.substring(0, relIndex);
    const lastCommaIndex = relSubstring.lastIndexOf(',');
    const pageSubstring = relSubstring.substring(lastCommaIndex + 1);
    const pageMatch = pageSubstring.match(/&page=(\d+)/);
    return pageMatch ? parseInt(pageMatch[1]) : 1;
}

// Function to fetch GitHub data
function fetchGitHubData() {
    const username = document.getElementById('username').value;
    const apiUrl = `https://api.github.com/users/${username}/repos`;

    // Show loader while fetching data
    $('#repositories-section').html('<p class="loading">Loading...</p>');

    // Fetch user profile data
    $.get(`https://api.github.com/users/${username}`)
        .done(function (user) {
            const profileSection = $('#profile-section');
            profileSection.html(`
                <img src="${user.avatar_url}" alt="${user.login}" class="profile-img">
                <div class="profile-details">
                    <p class="font-weight-bold">${user.name || 'No name available'}</p>
                    ${user.bio ? `<p>${user.bio}</p>` : ''}
                    <p>GitHub: <a href="${user.html_url}" target="_blank">${user.html_url}</a></p>
                    ${user.company ? `<p>Company: ${user.company}</p>` : ''}
                    ${user.location ? `<p>Location: ${user.location}</p>` : ''}
                    ${user.blog ? `<p>Website: <a href="${user.blog}" target="_blank">${user.blog}</a></p>` : ''}
                    ${user.twitter_username ? `<p>Twitter: <a href="https://twitter.com/${user.twitter_username}" target="_blank">${user.twitter_username}</a></p>` : ''}
                    ${user.email ? `<p>Email: <a href="mailto:${user.email}">${user.email}</a></p>` : ''}
                </div>
            `);
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            const errorMessage = errorThrown ? errorThrown : 'Error fetching user data.';
            $('#profile-section').html(`<p class="loading">${errorMessage}</p>`);
        });

    // Fetch user repositories with pagination
    fetchRepositories(apiUrl);
}

// Function to fetch repositories with pagination
function fetchRepositories(url, page = 1) {
    // Fetch repositories with pagination
    $.get(url, { per_page: 10, page: page })
        .done(async function (repositories, textStatus, xhr) {
            const repositoriesSection = $('#repositories-section');
            repositoriesSection.html('');

            const fetchRepoData = async (repo) => {
                try {
                    // Fetch languages for each repository
                    const languagesUrl = `https://api.github.com/repos/${repo.full_name}/languages`;
                    const languages = await $.get(languagesUrl);

                    repositoriesSection.append(`
                        <div class="repository col-md-6">
                            <h3>${repo.name}</h3>
                            <p>${repo.description || 'No description available'}</p>
                            <p>Languages: ${Object.keys(languages).join(', ')}</p>
                            <a href="${repo.html_url}" target="_blank" class="btn btn-primary btn-sm mt-2"><i class="fab fa-github"></i> View on GitHub</a>
                        </div>
                    `);
                } catch (error) {
                    console.error(`Error fetching data for repository ${repo.name}: ${error.message}`);
                }
            };

            const fetchAllRepoData = async () => {
                for (const repo of repositories) {
                    await fetchRepoData(repo);
                }

                // Add pagination information
                const linkHeader = xhr.getResponseHeader('Link');
                if (linkHeader) {
                    const links = linkHeader.split(',');
                    const lastPage = getPageNumber(linkHeader, 'rel="last"');

                    let paginationHtml = '';
                    const maxPagesToShow = 5;

                    // Previous Page link
                    if (page > 1) {
                        paginationHtml += `<a href="#" onclick="fetchRepositories('${url}?per_page=10&page=${page - 1}', ${page - 1});">&lt; Prev</a>`;
                    }

                    // Page links
                    const startPage = Math.max(1, Math.min(page - Math.floor(maxPagesToShow / 2), lastPage - maxPagesToShow + 1));

                    for (let i = startPage; i < startPage + maxPagesToShow && i <= lastPage; i++) {
                        const activeClass = i === page ? 'active' : '';
                        paginationHtml += `<a href="#" onclick="fetchRepositories('${url}?per_page=10&page=${i}', ${i});" class="${activeClass}">${i}</a>`;
                    }

                    // Next Page link
                    if (page < lastPage) {
                        paginationHtml += `<a href="#" onclick="fetchRepositories('${url}?per_page=10&page=${page + 1}', ${page + 1});">Next &gt;</a>`;
                    }

                    // Set the generated HTML to the pagination element
                    $('#pagination').html(paginationHtml);
                }
            };

            fetchAllRepoData();
        })
        .fail(function () {
            $('#repositories-section').html('<p class="loading">Error fetching repositories. Please try again.</p>');
        });
}
