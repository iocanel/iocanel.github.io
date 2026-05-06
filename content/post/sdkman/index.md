+++
title = "A quick look at sdkman"
author = ["Ioannis Canellos"]
description = "A quick look at sdkman"
date = 2018-10-16T15:57:00+03:00
draft = false
categories = ["tools"]
tags = ["java", "sdkman"]
+++

## Prologue {#prologue}

I recently came across [micronaut](http://micronaut.io) one of the many java micro-frameworks that gain a lot of interest lately.
This particular framework was being installed locally using a tool that I haven't come accross before: [sdkman](https://sdkman.io).

This will be a really short post about sdkman.


## What is sdkman? {#what-is-sdkman}

Even if you only use a computer for playing games, sooner or later you are going to have to manage multiple versions of the same piece of software.
Now, if you are into development then its possible that you've either have a handcrafted solution or using one provided by the operating system.


### Handcrafted {#handcrafted}

Be it the jdk itself, maven or even my IDE, I used to throw everything under ~/tools as versioned directories (e.g. maven-2.2.9, maven-3.3.5 etc) and then use symbolic links so that I have a fixed name (e.g. maven) linked to a versioned folder (maven -&gt; maven-3.3.5).
My PATH only included the link and not the versioned folder, so switching versions was just a matter of pointing the link to a different version.

{{< figure src="ls-tools.png" >}}

Of course, this is one of the many ways to do things and is only described here to emphasize on the importance of tools like sdkman.


### Operating system tools {#operating-system-tools}

The last couple of years I've been mostly using linux and most of the distributions I've used included some sort of tooling for maintaining multiple versions of popular packages.
Currently, I am on [archlinux](https://archlinux.org) and for managing multiple versions of java is using \`archlinux-java\` as described: <https://wiki.archlinux.org/index.php/Java>. Other distributions have similar tools.

This is definitely an improvement compared to the manual approach described above, but don't expect to find support for more exotic stuff.

My understanding on [sdkman](https://sdkman.io) is that its aiming to fill that gap for all \`sdks\`.


## Installation {#installation}

The installation process is straight forward and its just a simple command:

```shell
curl -s "https://get.sdkman.io" | bash
```

and then for initialization:

```shell
source "$HOME/.sdkman/bin/sdkman-init.sh"
```

This will modify the bash/zsh rc files, so that it adds an export to the SDKMAN_DIR and also add the sdkman initialization.
While this is no biggie, as a lot of tools now days tend to modify your rc files, I am not really fond of this approach.

To verify the installation:

```shell
sdk version
```


## Using sdkman {#using-sdkman}

To use sdkman you just need to use the \`sdk\` function. As I was curious to see what sdks are supported, the first thing I tried was the list operation:

```shell
sdk list
```

This generated a long list, with things like:

-   ant
-   maven
-   gradle
-   sbt
-   spring boot
-   micronaut
-   java
-   visualvm

and more...


### Installing an sdk {#installing-an-sdk}

I will use sdkman to install [kotlin](https://kotlinlang.org) in my environment

```shell
sdk install kotlin
```

{{< figure src="install-kotlin.png" >}}


### Installing a specific version of an sdk {#installing-a-specific-version-of-an-sdk}

This installed version 1.2.71. But what if I wanted to install an older version? Say \`1.2.70\`?

```shell
sdk install kotlin 1.2.70
```

The older version got installed, but I was also prompted to select which one will be the default one.

{{< figure src="default-version-confirmation.png" >}}

This is really neat. I can verify that the version was successfully installed using the kotling binary:

```shell
kotlin -version
```


### Changing the default version of an sdk {#changing-the-default-version-of-an-sdk}

Not if I wanted to switch again to the latest version:

```shell
sdk default version 1.2.71
```

if no version is explicitly specified [sdkman](https://sdkman.io) will set as default the latest stable. That's an other nifty feature.


### Broadcast messages {#broadcast-messages}

One other thing that I liked is that some of the sdk commands, do display a broadcast message, that informs the user of new version available etc. Really useful!


## Closing thoughts {#closing-thoughts}

[sdkman](https://sdkman.io) is not a tool that will change the world, but it does a simple job and does it really well. I'd like to see more sdks supported and of course not just java based ones.
Personally, I am even tempted to use it for the java itself, given that nowdays the releases are so often that its hard to keep up!
