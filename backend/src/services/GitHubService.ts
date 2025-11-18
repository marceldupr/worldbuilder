import { Octokit } from '@octokit/rest';

export class GitHubService {
  private octokit: Octokit | null = null;

  /**
   * Initialize GitHub client with user's access token
   */
  initializeWithToken(accessToken: string) {
    this.octokit = new Octokit({
      auth: accessToken,
    });
  }

  /**
   * Get authenticated user info
   */
  async getUser() {
    if (!this.octokit) {
      throw new Error('GitHub client not initialized');
    }

    const { data } = await this.octokit.users.getAuthenticated();
    return data;
  }

  /**
   * Create a new repository
   */
  async createRepository(name: string, description?: string, isPrivate = false) {
    if (!this.octokit) {
      throw new Error('GitHub client not initialized');
    }

    const { data } = await this.octokit.repos.createForAuthenticatedUser({
      name,
      description,
      private: isPrivate,
      auto_init: false,
    });

    return data;
  }

  /**
   * Create or update a file in a repository
   */
  async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    sha?: string
  ) {
    if (!this.octokit) {
      throw new Error('GitHub client not initialized');
    }

    const contentEncoded = Buffer.from(content).toString('base64');

    const { data } = await this.octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: contentEncoded,
      ...(sha && { sha }),
    });

    return data;
  }

  /**
   * Get file contents from repository
   */
  async getFile(owner: string, repo: string, path: string) {
    if (!this.octokit) {
      throw new Error('GitHub client not initialized');
    }

    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
      });

      if ('content' in data) {
        return {
          content: Buffer.from(data.content, 'base64').toString('utf-8'),
          sha: data.sha,
        };
      }

      return null;
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Push multiple files to repository
   */
  async pushFiles(
    owner: string,
    repo: string,
    files: Array<{ path: string; content: string }>,
    commitMessage: string
  ) {
    if (!this.octokit) {
      throw new Error('GitHub client not initialized');
    }

    // Get the current commit SHA
    const { data: ref } = await this.octokit.git.getRef({
      owner,
      repo,
      ref: 'heads/main',
    });

    const commitSha = ref.object.sha;

    // Get the commit
    const { data: commit } = await this.octokit.git.getCommit({
      owner,
      repo,
      commit_sha: commitSha,
    });

    const treeSha = commit.tree.sha;

    // Create blobs for all files
    const blobs = await Promise.all(
      files.map(async (file) => {
        const { data: blob } = await this.octokit!.git.createBlob({
          owner,
          repo,
          content: Buffer.from(file.content).toString('base64'),
          encoding: 'base64',
        });
        return {
          path: file.path,
          mode: '100644' as const,
          type: 'blob' as const,
          sha: blob.sha,
        };
      })
    );

    // Create tree
    const { data: tree } = await this.octokit.git.createTree({
      owner,
      repo,
      base_tree: treeSha,
      tree: blobs,
    });

    // Create commit
    const { data: newCommit } = await this.octokit.git.createCommit({
      owner,
      repo,
      message: commitMessage,
      tree: tree.sha,
      parents: [commitSha],
    });

    // Update reference
    await this.octokit.git.updateRef({
      owner,
      repo,
      ref: 'heads/main',
      sha: newCommit.sha,
    });

    return {
      commitSha: newCommit.sha,
      commitUrl: newCommit.html_url,
    };
  }

  /**
   * Create a pull request
   */
  async createPullRequest(
    owner: string,
    repo: string,
    title: string,
    head: string,
    base: string,
    body?: string
  ) {
    if (!this.octokit) {
      throw new Error('GitHub client not initialized');
    }

    const { data } = await this.octokit.pulls.create({
      owner,
      repo,
      title,
      head,
      base,
      body,
    });

    return data;
  }

  /**
   * List user repositories
   */
  async listRepositories() {
    if (!this.octokit) {
      throw new Error('GitHub client not initialized');
    }

    const { data } = await this.octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
    });

    return data;
  }
}

