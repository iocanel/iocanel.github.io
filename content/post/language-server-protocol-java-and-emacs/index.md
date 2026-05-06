+++
title = "Language Server Protocol, Java and Emacs"
author = ["Ioannis Canellos"]
date = 2018-06-20T19:00:00+03:00
draft = false
categories = ["hints"]
tags = ["java", "lsp", "emacs"]
+++

## Prologue {#prologue}

Lately I keep hearing about "how much software development has changed over the last half of the decade".
This usually refers to the adoption of containers, cloud etc. I would like to focus on an other factor of the change and that is the plethora of development related systems and services.

So its typical for a team to have:

-   version control
-   code review systems
-   code analysis systems
-   project management
-   issue trackers
-   continuous integration
-   chat / messaging

Add email to that and you realize that most of development related tasks now days take place in the browser.
Unfortunately, browsers by nature are unaware of the content they serve, so its not trivial to automate your workflow in the browser.
So, if the browser is not going to play the role of 'Swiss army knife' for development then what?

One could put all hopes in modern IDEs, however IDEs tend to be specialized more on language features and less about integration with external systems and services.
The later is usually a space where general purpose editors are better. And that is mostly because the have a wider and more uniform audience.
On the other hand these editors are not so rich in language related features.

So a big question is "Will editors like Atom, Emacs or Visual Studio Code ever be competitive to traditional IDEs for writing code?"
At least for Java developers, this used to be a "not viable option".

This is something that is going to change, due to the \`Language Server Protocol\`.


## What is the language server protocol? {#what-is-the-language-server-protocol}

[LSP](https://microsoft.github.io/language-server-protocol) is a standardized protocol for how "language servers" and "development tools" communicate.
A language server implements all the language specific operations once and then different development tools can connect to it and get the functionality for free.

So, if I create a new language say "AwesomeScript", instead of creating support for all editors out there, I'll just need to implement the language server once.
Then I would just need to write just a little bit of code for each editor (if any at all), to hook to the "language server".


## The history of language servers {#the-history-of-language-servers}

Traditional editors like [Emacs](https://www.gnu.org/software/emacs/) or [vim](https://www.vim.org/) have been using language servers for a while now. Some examples that come to mind are:

-   [Ensime](https://ensime.github.io/)
-   [Eclim](http://eclim.org/)
-   [Meghanada](https://github.com/mopemope/meghanada-server)

There was no standard protocol at that time (though there were visible similarities). The effort of standardization was initiated by Microsoft, as they starting
implementing one server after the other for the needs of [visual studio code](https://code.visualstudio.com/).
[More details on LSP history](https://github.com/Microsoft/language-server-protocol/wiki/Protocol-History).


## Language Server Protocol and Java {#language-server-protocol-and-java}

I've been writing Java for more than 15 years now. For nearly a decade I've been exclusively using [Intellij](https://www.jetbrains.com/idea/) for Java development. For everything else my goto editor has been [Emacs](https://www.gnu.org/software/emacs/) (at least the last year or so).
So, it made sense for me to experiment with LSP on Emacs and see how far can I get.


### Eclipse Java Language Server {#eclipse-java-language-server}

For Java the most popular implementation of the protocol is [Eclipse Java Language Server](https://github.com/eclipse/eclipse.jdt.ls). At this point I have to clarify that I've never managed to productively use the [Eclipse IDE](https://www.eclipse.org/). It always felt that it required
a lot of manual configuration and tuning for things (e.g. maven support, apt and more) that other alternatives provided out of the box.

{{< figure src="images/jdt-ls.png" >}}

The initial experience exceeded my expectations.

-   It was a lot faster than [Eclim](http://eclim.org/).
-   Navigating the code was working great.
-   Functionality provided by [lsp-ui](https://github.com/emacs-lsp/lsp-ui) worked surprisingly well (sideline, doc etc).
-   It gave me access to some simple refactoring tasks(see the image above).

Unfortunately, sooner or later the experience became way too Eclipsy for my taste.
What do I mean by that?
When added things like annotation processors etc into the mix, I started having issues that my "Google Fu" wasn't able to overcome in the little time I had ...
... or I am just not used in the "Eclipse" way of things and didn't want to put the extra effort ...
... or a little bit of both?


### IntelliJ Language Server {#intellij-language-server}

Here's where [LSP](https://microsoft.github.io/language-server-protocol) becomes really interesting...

I recently bumped into a project called [Intellij LSP Server](https://github.com/Ruin0x11/intellij-lsp-server), that actually provided an [Intellij](https://www.jetbrains.com/idea/) plugin that exposed the IDEs capabilities through LSP. This made it possible to use it as a drop in replacement of [Eclipse Java Language Server](https://github.com/eclipse/eclipse.jdt.ls).
So, I could get all the [lsp-ui](https://github.com/emacs-lsp/lsp-ui) related stuff for free but with added [Intellij](https://www.jetbrains.com/idea/) coolness.

It was a blast! It provided everything that  [Eclipse Java Language Server](https://github.com/eclipse/eclipse.jdt.ls) did, but with:

-   way better completion that was in par with [Intellij](https://www.jetbrains.com/idea/).
-   Better "run project" functionality.

Here's how completion looks:

{{< figure src="images/lsp-intellij-completion.png" >}}

And here's how the [lsp-ui](https://github.com/emacs-lsp/lsp-ui) stuff work with  [Intellij LSP Server](https://github.com/Ruin0x11/intellij-lsp-server):

{{< figure src="images/lsp-intellij-ui.png" >}}

The only downside for this project is that its still in alpha state and in many cases the server dies or blocks for user input.

Here's an example:


#### File Cache Conflict {#file-cache-conflict}

When [Intellij](https://www.jetbrains.com/idea/) detects that a file has been externally modified it opens up a pop-up that prompts the user to select if it should reload from disk or use the cached version.
When this dialog gets popped all the [LSP](https://microsoft.github.io/language-server-protocol) operations are blocked. As there seems no obvious way to disable it I hacked a little bash script to automatically click the button for me without leaving my editor:

The script searches for a window titled "File Cache Conflict" and when it does, it focuses on it and sends the space key event.
This accepts the default suggestion which is "Load from file system".
Finally, it switches back to my editor workspace (As an [i3 window manager](https://i3wm.org/) user, I run [Intellij](https://www.jetbrains.com/idea/) on workspace 4 and [Emacs](https://www.gnu.org/software/emacs/) on workspace 2).

Here's how the script looks like:

```nil
#!/bin/bash

function get-file-cache-conflict-window {
    xdotool search "File Cache Conflict" 2> /dev/null
}

function return-to-workspace {
    xdotool key --clearmodifiers Super_L+2
}

window=$(get-file-cache-conflict-window)
if [ -n "$window" ]; then
    echo "Switching to window $window."
    xdotool windowactivate --sync $window
    sleep 0.1
    xdotool key --clearmodifiers space
    return-to-workspace
fi
```

Unfortunately, there are other issues like that, that can leave you wondering why things stopped working, but I hope that they will get resolved soon, as I really like the project.


## Honorable Mention: Meghanada {#honorable-mention-meghanada}

[Meghanada](https://github.com/mopemope/meghanada-server) is not using the [LSP](https://microsoft.github.io/language-server-protocol) so I want get into much details about it. I will just say that it did work pretty well for me and my only complaint is that completion requires improvements.
Also, it worth mentioning that the maintainer is on fire and he fixes things really fast.


## Debug Protocol {#debug-protocol}

I recently found out that in the same spirit there is an effort about a Debug protocol. This is also something really needed if one is to move from a specialized IDE to a general purpose editor.


## Closing thoughts {#closing-thoughts}

I am really excited about [LSP](https://microsoft.github.io/language-server-protocol). I feel that it will provide additional freedom in tool/workflow selection.
Also, I think that it will play a very important role in initiatives like [Eclipse Che](https://www.eclipse.org/che/) or other Cloud IDEs.

For now, I am sticking to my IDE, but I will continue to experiment [LSP](https://microsoft.github.io/language-server-protocol) as I truly believe in the potential of fully programmable editors.
I intend to write more on this subject and maybe even create a demo.

I am interested in hearing about your setup, your experiences or any suggestion, so please do leave a comment!
