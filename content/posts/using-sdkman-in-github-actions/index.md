+++
title = "Using sdkman in github actions"
author = ["Ioannis Canellos"]
description = "Some tips on how to use sdkman in github actions"
date = 2021-09-20T09:20:00+03:00
draft = false
+++

## Introduction {#introduction}

I was experimenting with some [Github Actions](https://github.com/features/actions) that needed to make use of [Mandrel](https://github.com/graalvm/mandrel) so, I thought that I should use [sdkman](https://sdkman.io/).
I run into some issues though and I thought I should document the experience

The main issue I encountered, is that no matter how I mixed [sdkamn](https://sdkman.io/) into the mix, my steps acted like it was not


## The sdkamn action {#the-sdkamn-action}

It seems that there is a [Github Action for sdkman](https://github.com/sdkman/sdkman-action/) available, which should allow you to manage any \`candidate\`.
I used it like this:

```yaml
  - uses: sdkman/sdkman-action@master
    id: sdkman
    with:
      candidate: java
      version: 21.2.0.0-mandrel
```

But when I proceeded later on to make use of the \`native-image\` binary it was not there.


## Using sdkman manually {#using-sdkman-manually}

I decided that instead of troubleshooting the [Github Action for sdkman](https://github.com/sdkman/sdkman-action/), it might be simpler and quicker to manage <https://sdkman.io/> myself.

**It was not!**

This is what I tried:

```yaml
      - name: Setup sdkman
        run: |
          curl -s "https://get.sdkman.io" | bash
          source "$HOME/.sdkman/bin/sdkman-init.sh"
          sdkman_auto_answer=false
          sdkman_selfupdate_enable=false
```

The effect was similar. The step seemed to work with no issue whatsoever, but when I tried to use later on \`native-image\` it was not there.


### Trobleshooting {#trobleshooting}

When I started added debuging / troubleshooting command in my script, like:

```sh
     which java
     java --version
```

I realized that it was not using [Mandrel](https://github.com/graalvm/mandrel) at all, but instead a \`jdk 11\` binary that was found in the \`PATH\`.
The path? Did I say the path?

Bingo! For [sdkman](https://sdkman.io/) to properly work I should find an entry like \`$HOME/.sdkman/candidates/java/current/bin\` in my \`PATH\`.

**I didn't!**

Even worse, the \`sdk\` binary was also not found in the path !?


#### There is no such thing as an sdk binary! {#there-is-no-such-thing-as-an-sdk-binary}

In case, you don't already know, [sdkman](https://sdkman.io/) is not a binary but an alias that gets initialized by your shell. Usually, it should be initialized by a command like:

```sh
    [[ -s "$HOME/.sdkman/bin/sdkman-init.sh" ]] && source "$HOME/.sdkman/bin/sdkman-init.sh"
```

found inside your \`.bashrc\` or \`.zshrc\`.

The weird part of the story is that after checking what's inside those files, the [sdkman](https://sdkman.io/) initialization lines where present.


### bashrc is not executed {#bashrc-is-not-executed}

I searched online for \`github actions bashrc not executed\` The firs result that came back was pretty enlightening.
According to <https://github.community/t/self-hosted-not-using-bashrc/18358/2>:

\`In order for individual steps to make use of the .bashrc, one needs to explictly request it, by setting the default shell options:

```yaml
name: use bashrc
defaults:
  run:
    shell: bash -ieo pipefail {0}
```

I added this to my action and things worked like a charm.


## A full exmaple {#a-full-exmaple}

```yaml
name: Build

env:
  MAVEN_ARGS: -B -e

# We need to set these defaults so that .bashrc is called for each step.
# This is needed so that sdkman can be properly intialized
defaults:
  run:
    shell: bash -ieo pipefail {0}

on:
  push:
    branches:
      - master
  pull_request:

jobs:
  build:
    name: Clojure on Mandrel ${{ matrix.java-version }} with Leiningen ${{ matrix.lein-version }}
    runs-on: ubuntu-latest
    strategy:
      matrix:
        java-version: [21.2.0.0-mandrel]
        lein-version: [2.9.7]
    steps:
      - name: Checkout
        uses: actions/checkout@v2.3.4
      - name: Setup sdkman
        run: |
          curl -s "https://get.sdkman.io" | bash
          source "$HOME/.sdkman/bin/sdkman-init.sh"
          sdkman_auto_answer=false
          sdkman_selfupdate_enable=false
      - name: Setup java
        run: |
          sdk install java ${{matrix.java-version}}
          sdk default java ${{matrix.java-version}}
      - name: Setup leiningen
        run: |
          sdk install leiningen ${{matrix.lein-version}}
          sdk default leiningen ${{matrix.lein-version}}
      - name: Run tests
        run: lein test
      - name: Build native image
        run: |
          lein native-image
```

The full project can be found at: <https://github.com/iotemplates/clojure-cli>.
As always, I hope this was helpful. See ya!
