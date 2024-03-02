+++
title = "Hackers guide to Jiu Jitsu: Markdown Wiki"
author = ["Ioannis Canellos"]
description = "How to create a wiki to host your BJJ notes and media"
date = 2021-08-30T21:48:00+03:00
draft = false
categories = ["hobbies"]
tags = ["jiu jitsu"]
+++

{{< figure src="hackers-guide-to-jiu-jitsu.png" >}}


## Intro {#intro}

I am a 40+ software engineer and recreational Jiu Jitsu practitioner, struggling with vast amount of information related to the sport.
I decided to make use of my \`computer\` skills to aid me in the process of taming this new skill.

In this section I am going to discuss why and how [markdown](https://en.wikipedia.org/wiki/Markdown) is the ideal format for using for your notes. I am also going to conver how
to use [markdown](https://en.wikipedia.org/wiki/Markdown) in order to maintain wiki/second brain for your Jiu Jitsu notes.


## What is markdown ? {#what-is-markdown}

Markdown is a lightweight markup language for creating formatted text using a plain-text editor.
Formatting includes things like:

-   Headers
-   Bold, italic, underlined text
-   Images
-   Hyperlinks
-   Tables

If you know what html is, you can think of [markdown](https://en.wikipedia.org/wiki/Markdown) as an alternative to html that instead of weird tags, just makes clever use of symbols.

Here is an example:

```markdown

    # Heading
    ## Sub-heading

       Unordered list:

      - item 1
      - item 2
      - item 3

    | Syntax      | Description |
    | ----------- | ----------- |
    | Header      | Title       |
    | Paragraph   | Text        |

```


## Why markdown ? {#why-markdown}

It is 100% pure text. No propriatory file formats, no coupling to a particular editor or tool.
You can easily edit it from all your devices without the need of any specialized software.

This also means that you can easily generate or manipulate it using scripts (cough cough).
This is really important because we can easily export information from instructionals directly into [markdown](https://en.wikipedia.org/wiki/Markdown).

For example, we can generate an animated gif, as demonstrated in previous posts and embed the image into markdown (e.g. see my [notes on 'Double Under'](https://github.com/iocanel/blog/blob/master/hackers-guide-to-jiu-jitsu-04-markdown-wiki/wiki/double-under.md)).

Most importantly, [markdown](https://en.wikipedia.org/wiki/Markdown) supports links, which is what makes using [markdown](https://en.wikipedia.org/wiki/Markdown) for building ourselves a second brain (interconnected notes).


## What is a wiki ? {#what-is-a-wiki}

After searched for a proper definition in multiple wiki pages, I came up with:

\`Wiki is a knowledge base presented as collection of well connected web pages and colaboratively edited.\`

A richer definition can be found in [wikipedia: wiki](https://en.wikipedia.org/wiki/Wiki).

In this serires of posts we don't really care about the collaborative part, but more about the edited that implies that a wiki is something living/evolving, that is expected to be edited / updated.


## Why wiki ? {#why-wiki}

When I first started taking notes on Jiu Jitsu, I used a single text file, were I kept things. As the file grew larger, it was becoming harder and harder to easily jump to a particular note in the file.
Also, there were cases were I needed to link notes together ...

Think for a moment Juji gatame (armbar). How does one organize notes on juji gatame?

{{< figure src="Boromir-Juji-Gatame.jpg" >}}

-   Do they go in the attacks from mount section?
-   Do they go in the attacks from closed guard section?
-   Do they go in the flying attacks?
-   Do they go in the escapes from popular attacks?

I think that it should go everywhere. And the only pragmatic way for this to happen is by linking \`juji gatame\` to all of the sections listed above.

When it comes to note taking, anything that can't be represented by a single tree-like structure and contains links for one topic to another is better split per topic and use linking to bring pieces together.

This alone is enough for one to pickup wiki.
Additional points for familiarity.
And most importantly it is something that can be easily combined with [markdown](https://en.wikipedia.org/wiki/Markdown) that is already mentioned above.

Have a look at my demo [wiki](https://github.com/iocanel/blog/tree/master/hackers-guide-to-jiu-jitsu-04-markdown-wiki/wiki/index.md), to get some idea:

This is not my complete wiki but something that I put together for the shake of this post (with hopefully enough teasers inside). It includes:

-   Chunks of my personal notes
-   Flow chart diagrams (for techniques) that I created myself (and yes, I will blog about how you can create them too).
-   An animated gif or two that summarize techniques

This might also be a nice starting point for your own wiki, if you are sold on the idea.


## Creating a markdwon based wiki for Jiu jitsu {#creating-a-markdwon-based-wiki-for-jiu-jitsu}

Next step is to pick ourselves up the right tool for the job. Below there are the top three candidates:

-   [Github](https://github.com/)
-   [mdwiki](http://dynalon.github.io/mdwiki/#!index.md)
-   [tiddlywiki](https://tiddlywiki.com/)


### Github {#github}

Github is a [git](https://git-scm.com/) hosting service.

<span class="underline">**Oversimplification alert**</span>

Think of it as service that allows you to create public or private shared folders, that contain textual (mostly) and binary files. The service also keeps history of changes and provides a platform for collaboration with others.
I wouldn't suggest it to people not already familiar with git.

My demo [wiki](https://github.com/iocanel/blog/tree/master/hackers-guide-to-jiu-jitsu-04-markdown-wiki/wiki/index.md) is hosted on [Github](https://github.com/), so you get the idea.


### Tiddlywiki {#tiddlywiki}

A wiki solution, that allows users to host their wiki either locally or publicly. It's pretty extensible and one of the extensions provides [markdown](https://en.wikipedia.org/wiki/Markdown) support.
Even thought it seems pretty powerful, the installation of extensions proved to be a little bit tricky for me, so I wouldn't recommend it either.


### mdwiki. {#mdwiki-dot}

[mdwiki](http://dynalon.github.io/mdwiki/#!index.md) (as the namely implies) is a [markdown](https://www.markdownguide.org/) based wiki. I found it pretty simple to install and use and it's what I recommend to use in this post.
**Note**: This solution is not standalone and does require the use of an http server (see below).


## Installing mdwiki {#installing-mdwiki}

Go to [mdwiki releases page](https://github.com/Dynalon/mdwiki/releases) and grab the latest release zip file. At the time of writing this was [mdwiki-0.6.2.zip](https://github.com/Dynalon/mdwiki/releases/download/0.6.2/mdwiki-0.6.2.zip)
Extract the contents of the zip in the folder you wish to save your notes.

On most systems, something like this would work.

```sh
   unzip mdwiki-0.6.2.zip
```

Or use whatever you already use for extracting zip archives.


## Installing an http server {#installing-an-http-server}

We will need an http server to serve our wiki.


### Machines with nodejs installed (Windows, OSX &amp; Linux) {#machines-with-nodejs-installed--windows-osx-and-linux}

On machines with [nodejs](https://nodejs.org/en/) already installed the easiest solution is to install [http-sever](https://www.npmjs.com/package/http-server) via npm.

```sh
   npm install -g http-server
```

If you don't have [nodejs](https://nodejs.org/en/) installed, then follow the operating system specific options.


### Windows {#windows}

On windows you can just use the [simple http server](https://www.microsoft.com/en-us/p/simple-http-server/9nt5t97khpqg?activetab=pivot:overviewtab) or any other server of your choice.
Just install the application and select the [mdwiki](http://dynalon.github.io/mdwiki/#!index.md) folder as the server root.


## Using the http server with your wiki {#using-the-http-server-with-your-wiki}

Assuming that you have your wiki files under \`wiki\` in your home directory, you could try:

```sh
  http-server wiki
```

or in general

```sh
  http-sevrver /path/to/wiki
```


## Using mdwiki via docker {#using-mdwiki-via-docker}

Maybe this whole series should have started with post on [docker](https://www.docker.com/) but it didn't. So, I'll just through here a few words on [docker](https://www.docker.com/) and how to use it to run your wiki.


### A few words on docker {#a-few-words-on-docker}

I'll try to explain docker with as little technical details possible.

Imagine the following use cases:

-   You want to run an application without installing it locally.
    Why ?
    -   To quickly try out the application
    -   To use a different version of the application you have currently installed.
    -   To avoid having to deal with installing required software
    -   Security related reasons
-   You want to run application that is not installable on your Operating System.
-   You want to package multiple binaries / apps and configuration in a single bundle.
-   You want something like a virtual machine, but:
    -   Easier to create
    -   Smaller
    -   With faster startup

So, [docker](https://www.docker.com/) is a possible solution for the use cases described above.


### Running mdwiki via docker {#running-mdwiki-via-docker}

If you already have [docker](https://www.docker.com/) installed on your machine and don't fancy dealing with how to install a webserver to run your wiki, look no futher.

```sh
     docker run -d -p 80:8080 -v ~/wiki:/wiki iocanel/http-server:09.2021 /wiki
```

Just open your browser at \`<http://localhost>\` and you should be good to go.


## Using your wiki {#using-your-wiki}

From this point on you can start using your wiki and fill it with notes.

I won't spent time explaining the sytax. I've already provided a links to guides [markdown](https://en.wikipedia.org/wiki/Markdown) docs. (every occurance [markdown](https://en.wikipedia.org/wiki/Markdown) is a link to <https://www.markdownguide.org/>).
I also use from time to time this [cheatsheet](https://guides.github.com/pdfs/markdown-cheatsheet-online.pdf). In any case, the syntax is pretty trivial and this is why its recommended.

You will be able to catch up with syntax pretty fast, but it might take you a while before you find how to best organize your notes.

I found that what works best for me is to keep each note as small and focused as possible. This allows me to better link pieces together in meanigful way.
Have a look at my demo [wiki](https://github.com/iocanel/blog/tree/master/hackers-guide-to-jiu-jitsu-04-markdown-wiki/wiki/index.md) to get ideas, or even use it as a starting template for your wiki.

Also, I am really interested in knowing if how you organize your notes, so feel free to reach out to me and share your experiences, either by commenting, email etc.


## Post index {#post-index}

-   01. Hackers guide to Jiu Jitsu: intro [wordpress version](https://iocanel.com/2021/08/hackers-guide-to-jiu-jitsu) [github version](https://github.com/iocanel/blog/tree/master/hackers-guide-to-jiu-jitsu-01-intro)
-   02. Hackers guide to Jiu Jitsu: ffmpeg [wordpress version](https://iocanel.com/2021/08/hackers-guide-to-jiu-jitsu-ffmpeg) [github version](https://github.com/iocanel/blog/tree/master/hackers-guide-to-jiu-jitsu-02-ffmpeg)
-   03. Hackers guide to Jiu Jitsu: mplayer [wordpress version](https://iocanel.com/2021/08/hackers-guide-to-jiu-jitsu-mplayer) [github version](https://github.com/iocanel/blog/tree/master/hackers-guide-to-jiu-jitsu-03-mplayer)
-   04. Hackers guide to Jiu Jitsu: markdown wiki [wordpress version](https://iocanel.com/2021/08/hackers-guide-to-jiu-jitsu-markdown-wiki) [github version](https://github.com/iocanel/blog/tree/master/hackers-guide-to-jiu-jitsu-04-markdown-wiki)
-   05. Hackers guide to Jiu Jitsu: flowcharts [wordpress version](https://iocanel.com/2022/01/hackers-guide-to-jiu-jitsu-flowcharts) [github version](https://github.com/iocanel/blog/tree/master/hackers-guide-to-jiu-jitsu-05-flowcharts)
