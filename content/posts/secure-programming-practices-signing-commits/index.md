+++
author = ["Ioannis Canellos"]
title = "Secure programming practices - Signed commits"
date = 2025-04-02
draft = false
categories = ["development"]
tags = ["security", "git", "gpg", "ssh"] 
+++

## Signing Git Commits {#signing-git-commits}

I recently had a discussion with two fellow engineers about secure coding practices.
After the discussion I realized that I am neglecting one of the most important practices: signing my commits.

There are tons of articles on the internet explaining why and how. These are my notes on the subject that I decided to publish.

These notes actually use `literate programming` so they are a mix of notes and code you can actually use via org-mode.
You can find the actual notes file [here](https://github.com/iocanel/blog/blob/main/2025/04/02/Secure%20programming%20practices%20-%20Signed%20commits/readme.org).

### Why bother? {#why-bother}

Signing commits, allows you to track who made the commit and that the commit has not been tampered with.
More specifically, it allows you to verify that commit is signed using either a GPG key or an SSH key.

Does this protect you in the case your Github account get's compromised?
No, it does not as the attacker most likely will change the signing key.
Still, it verifies that the commit was not signed by your key.
If you are using GPG, where keys are public, it also allows others to verify that the commit was signed by you.


### Using GPG to sign commits {#using-gpg-to-sign-commits}

Let's see how we can use GPG to sign commits.


#### Extracting the GPG Key ID {#extracting-the-gpg-key-id}

First, we need to extract the key ID of the GPG key we want to use.

<a id="code-snippet--extract-key-id"></a>
```shell
gpg --list-keys "iocanel@gmail.com" | grep -v pub | grep -v sub | grep -v uid | xargs
```

The sections below will use \`$KEY_ID\` to refer to the actual value.


#### Configure Git to Use Your GPG Key {#configure-git-to-use-your-gpg-key}

Extract the key ID and use it to configure Git:

```shell
git config --global commit.gpgsign true
git config --global gpg.program gpg
git config --global gpg.format openpgp
git config --global user.signingkey $KEY_ID
```


#### Export GPG Public Key for GitHub {#export-gpg-public-key-for-github}

Export your public key in ASCII-armored format for GitHub:

<a id="code-snippet--public-key-block"></a>
```shell
gpg --armor --export $KEY_ID
```


#### Add GPG Key to GitHub {#add-gpg-key-to-github}

There are two ways of dealing with it:

-   Manualy
-   Using the Github API

<!--list-separator-->

-  Add it manually to the Github settings page

    Go to <https://github.com/settings/keys> and manually add it.

<!--list-separator-->

-  Use gh and the Github API

    <!--list-separator-->

    -  Enable api access to GPG

        ```shell
        gh auth refresh -h github.com -s admin:gpg_key
        ```

    <!--list-separator-->

    -  Add the Key using gh and the API

        ```shell
        gpg --armor --export iocanel@gmail.com > /tmp/publickey.asc
        gh api --method POST -H "Accept: application/vnd.github+json" /user/gpg_keys -f armored_public_key="$(cat /tmp/publickey.asc)"
        rm /tmp/publickey.asc
        ```


### Using SSH to sign commits {#using-ssh-to-sign-commits}


#### Generate a new SSH key {#generate-a-new-ssh-key}

```shell
git config commit.gpgsign true
git config gpg.format ssh
git config gpg.ssh.program ssh-keygen
git config user.signingkey /home/iocanel/.ssh/id_rsa
```


#### Add SSH Singing Key to GitHub {#add-ssh-singing-key-to-github}

Again, there are two ways of dealing with it (as with GPG):

-   Manualy
-   Using the Github API

<!--list-separator-->

-  Add it manually to the Github settings page

    Go to <https://github.com/settings/keys> and manually add it.

<!--list-separator-->

-  Use gh and the Github API

    <!--list-separator-->

    -  Enable api access to SSH signing keys

        ```shell
        gh auth refresh -h github.com -s admin:ssh_signing_key
        ```

    <!--list-separator-->

    -  Add the Key using gh and the API

        ```shell
        gh api -X POST -H "Accept: application/vnd.github+json" /user/ssh_signing_keys -f key="$(cat ~/.ssh/id_rsa.pub)"  -f title="My SSH signing key"
        ```


### GPG or SSH? {#gpg-or-ssh}

So, which one should you use?

I like the idea of using GPG keys for signing commits, due to the fact that they are public and can be used to verify the commit.
SSH in some scenarios and some integration might be more convenient.
