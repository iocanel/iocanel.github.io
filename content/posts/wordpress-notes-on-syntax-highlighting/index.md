+++
title = "Wordpress: Notes on syntax highlighting"
author = ["Ioannis Canellos"]
description = "Some personal notes on how to configure syntax highlighting for wordpress"
date = 2021-09-01T12:38:00+03:00
draft = false
+++

## Prologue {#prologue}

These are just some personal notes, that I'll surely forget unless I write them down.


## The problem {#the-problem}

As I am bloging for over a decade now and most of the time I am sharing code, I needed of a decent way to highlight my code and make it available to users.
In the beginning I was using [blogger](https://www.blogger.com/) but later on I migrated to [wordpress](https://wordpress.com/).

So, I needed a syntax highlighting solution similar to what I was using for [blogger](https://www.blogger.com/).


## The solution {#the-solution}

A quick search in the internet revealed the [Syntax Highlighter Evolved](https://el.wordpress.org/plugins/syntaxhighlighter/) plugin, which I installed a started using.


## More problems {#more-problems}

After using the [Syntax Highlighter Evolved](https://el.wordpress.org/plugins/syntaxhighlighter/) plugin for a while I realized that it came with a few issues.


### Missing an action toolbar {#missing-an-action-toolbar}

I am sure you've seen code blocks that come not only with syntax highlighting but also with a nice toolbar that allows you to copy, print, open in a new tab etc.
I needed something like that but it was missing.


#### Bringing back the toolbar {#bringing-back-the-toolbar}

Luckily, I figured that downgrading to version 2.x of the plugin brings the toolbar back.
As of now, I see no reason to use 3.x, the old one seems way nicer!


### Escaping of characters {#escaping-of-characters}

The most annoying thing was the code I shared was escaped. All html symbols like \`&lt;\` and \`&gt;\`  where replace by \`lt;\` and \`gt;\` respectively.
I searched for a solution and it seems that were plenty available on the internet but I settled with the one below.


#### Using the classical editor {#using-the-classical-editor}

Wordpress nowdays comes with many different editors:

-   WSIWYG
-   Guttenberg
-   Classical

It seems that the best editor to use along with the [Syntax Highlighter Evolved](https://el.wordpress.org/plugins/syntaxhighlighter/) plugin is the [classic editor](https://wordpress.org/plugins/classic-editor/).

Once the plugin is installed it can be easily enabled for all or specific users. The easiest solution for me was all users.

{{< figure src="enabling-classic-editor.png" >}}

Enabling the [classic editor](https://wordpress.org/plugins/classic-editor/) is the first step. Next step is to edit the post and fix the broken code blocks (they will not be escaped again).
If you are using an external post editor, just publish the post again and you're golden. For example, I am using [Org 2 Blog](https://github.com/org2blog/org2blog) so I just had to re-publish the broken posts and everything was fixed!


## Epilogue {#epilogue}

Now, the code blocks seem really nice and ready for use.
I hope you found it useful. My future self most cerntaintly will!
