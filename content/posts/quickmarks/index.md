+++
title = "Quickmarks"
author = ["Ioannis Canellos"]
description = "Create an emacs snippet to easily create org links using quickmarks"
date = 2018-09-05T18:52:00+03:00
draft = false
categories = ["hints"]
tags = ["emacs", "org-mode"]
+++

## Overview {#overview}

This is a small post that describes how I made authoring [markdown](https://en.wikipedia.org/wiki/Markdown), [org-mode](https://orgmode.org) etc easier by using snippets that help me handle links like a pro.


## Prologue {#prologue}

I am a heavy user of [org-mode](https://orgmode.org). I use it for taking notes, writing blogs, presentations and so on.
As a software developer I often use markdown too. In both cases at some point I have to deal with links.

Embarrassingly enough, I used to rely on my browsers bookmarks to handle links, so my workflow looked a little like:

-   open the browser
-   search for the url of interest in bookmarks
-   copy the url
-   jump to the editor
-   use the special syntax for adding links
-   paste the copied url
-   add a text to appear on the link

I find this so counter-intuitive that is hands down the most boring thing for me when it comes to writing.


## Quickmarks {#quickmarks}


### All the cool kids should try... {#all-the-cool-kids-should-try-dot-dot-dot}

A year back (maybe) more I came across a video for linux geeks, according to which all the cool kids should try [qutebrowser](https://qutebrowser.org).
And so I did.

Among other a feature of this browser I liked was quickmarks.


### What are quickmarks? {#what-are-quickmarks}

Quickmarks are just labeled bookmarks.


### And what so special about them? {#and-what-so-special-about-them}

It makes it easy to search for bookmarks, since the \`open\` action does not just search in history and bookmarks it also allows you to search by label.
It might not sound much, but it did add a lot to my browsing experience.


### What does it have to do with writing docs, blogs and presentations? {#what-does-it-have-to-do-with-writing-docs-blogs-and-presentations}

I'd like my editor to support quickmarks, so that I don't have to jump back and forth to my browser.

As an [emacs](http://emacs.org) user adding quickmarks is as easy as adding the following code to my config:

```nil
     (defvar quickmarks-alist '() "A list of labeled links for quick access")
     (setq quickmarks-alist '(
                              ;; emacs
                              (org-mode . https://orgmode.org)
                              (emacs . http://emacs.org)
                              (spacemacs . http://spacemacs.org)
                              (yasnippets . https://github.com/joaotavora/yasnippet)
                              ;; linux
                              (i3 . https://i3wm.org)
                              (mutt . http://www.mutt.org)
                              (weechat . https://weechat.org)
                              (qutebrowser . https://qutebrowser.org)
                              (ranger . https://github.com/ranger/ranger)
                              ;; work
                              (docker . https://docker.io)
                              (fabric8 . https://fabric8.io)
                              (kubernetes . https://kubernetes.io)
                              (openshift . https://openshift.com)
                              (snowdrop . https://snowdrop.me)
                              (spring . https://spring.io)
                              (spring cloud . https://cloud.spring.io)
                              (spring boot . https://spring.io/projects/spring-boot)
                              (spring cloud connectors . https://cloud.spring.io/spring-cloud-connectors)
                              (jenkins . https://jenkins.io)
                              )
           )
```

And then to easily access those links I can use a function as follows:

```nil
     (defun quickmarks-get (k)
       "Get the value of the quickmark with the key K."
       (alist-get (intern k) quickmarks-alist)
       )
```


### Creating quickmark aware snippets {#creating-quickmark-aware-snippets}

For writing snippets I use [yasnippets](https://github.com/joaotavora/yasnippet). [yasnippets](https://github.com/joaotavora/yasnippet) allow users to integrate code into the snippet and that will help us look up our quickmarks from within the snippet.

So for markdown documents the snippet looks like:

```nil
     # -*- mode: snippet -*-
     # name: quickmark
     # key: qm
     # --
     [${1:Name}](${1:$(quickmarks-get yas-text)}) $0
```

and for org-mode:

```nil
     # -*- mode: snippet -*-
     # name: quickmark
     # key: qm
     # --
[[${1:$(quickmarks-get yas-text)}][${1:Name}]] $0
```


### Using the snippet in action {#using-the-snippet-in-action}

{{< figure src="demo.gif" >}}


## Epilogue {#epilogue}

All of the code used in this post can also be found in my [dotfiles](https://github.com/iocanel/dotfiles) repository.

I hope you found it useful!
