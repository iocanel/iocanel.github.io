+++
title = "Hackers guide to Jiu Jitsu: mplayer"
author = ["Ioannis Canellos"]
description = "Using mplayer hacks to capture notes from bjj instructionals"
date = 2021-08-30T21:48:00+03:00
draft = false
+++

{{< figure src="hackers-guide-to-jiu-jitsu.png" >}}


## Intro {#intro}

I am a 40+ software engineer and recreational Jiu Jitsu practitioner, struggling with vast amount of information related to the sport.
I decided to make use of my \`computer\` skills to aid me in the process of taming this new skill.

This post is going to demonstrate how to use [mplayer](http://www.mplayerhq.hu/) for watching Jiu Jitsu instructionals, in order to:

-   Capture notes
-   Create bookmarks
-   Create animated gifs demonstrating techniques

This post will cover the fundamentals and will be the base for future posts that will demonstrate integrations with ohter tools.


## What is mplayer ? {#what-is-mplayer}

[mplayer](http://www.mplayerhq.hu/) as the name implies is a video player. It's free &amp; opensource and available for most operationg systems.
It's pretty minimal but powerful and is often used by other players as a backend.

There are two main features that make it stand out from the rest of the available players.


### Slave mode {#slave-mode}

When [mplayer](http://www.mplayerhq.hu/) is run on slave mode, it allows other programs to communicate with it, through a file. Programs append commands to the file and mplayer can pick them up.
So, other programs can

-   start / stop
-   go to a specific timestamp
-   extract player information


### Custom key bindngs and commands {#custom-key-bindngs-and-commands}

With custom keybindings and commands users are able to easily invoke external scripts, which is very handy as we will see later on.


## Why we need mplayer ? {#why-we-need-mplayer}

In previous parts in the series, we saw how we could do things like creating animated gifs.
While technically it was pretty straight forward, it was not very user frindly as the user had to manually keep track of the file name and start/stop timestamps.

[mplayer](http://www.mplayerhq.hu/) running on slave mode can easily helps us create a user friendly solution to this problem.

Sometimes we just want to bookmark the video currently playing so that we can resume later on.
Other times we just want to have bookmarks as a reference in our notes.
Again [mplayer](http://www.mplayerhq.hu/) can provide an elegant solution to these problems.


## Installing mplayer {#installing-mplayer}

This section describes how to install it based on your operating system.


### Linux {#linux}

If you are using linux chances are that you don't really need me to tell you how to install it.


#### Fedora {#fedora}

```sh
  sudo dnf -y install mplayer
```


#### Ubuntu {#ubuntu}

```sh
  sudo apt-get install mplayer
```


### OSX {#osx}

```sh
  brew install mplayer
```


### Windows {#windows}

Windows users will have to install and get familiar with [wsl](https://docs.microsoft.com/en-us/windows/wsl/install-win10), first.
Then:

```sh
  sudo apt-get install mplayer
```

From now on all command we provide will need to go via [wsl](https://docs.microsoft.com/en-us/windows/wsl/install-win10) unless explicitly specified.


## Slave mode {#slave-mode}

To start mplayer in slave mode:

```sh
  mplayer -slave -quiet <movie>
```

Now you can enter commands in the console and read the output from there.

Or you can use a fifo file instead:

```sh
  mkfifo </tmp/fifofile>
  mplayer -slave -input file=</tmp/fifofile> <movie>
```

However, it's much simler if you just configure mplayer to always run in slave mode (by adding the config below to \`.mplayer/config\`):

```cfg
  slave=true
  input:file=/path/to/home/.local/share/mplayer/fifo
```

This assumes that you've created up front a fifo file:

```sh
  mkdir -p ~/.local/share/mplayer
  mkfifo ~/.local/share/mplayer/fifo
```

**Note**: You can use whatever path for the fifo file.


### Using the slave mode {#using-the-slave-mode}

We will start [mplayer](http://www.mplayerhq.hu/) in slave mode and redirect it's output in a temporary file so that we can process the command output:

```sh
  mplayer -slave -input file=</tmp/fifofile> <movie> > </tmp/output>
```

Now we can start executing commands:


#### Getting the file name {#getting-the-file-name}

We are going to send \`get_file_name\` to player in order to get the file name:

```sh
  echo get_file_name > /tmp/fifofile
  sleep 1
  cat /tmp/output | grep ANS_FILENAME | tail -n 1 | cut -d "=" -f2
```


#### Getting the timestamp {#getting-the-timestamp}

We are going to send \`get_time_pos\` to player in order to get the time position:

```sh
  echo get_time_pos > /tmp/fifofile
  sleep 1
  cat /tmp/output | grep ANS_TIME_POSITION | tail -n 1 | cut -d "=" -f2
```


### Full list of available commands {#full-list-of-available-commands}

You can find a complete reference of commands at: <http://www.mplayerhq.hu/DOCS/tech/slave.txt>


### Putting the commands together {#putting-the-commands-together}

Let's combine the commands above in order to easily create an animated gif.
The idea is to have a command to:

-   mark the beggining
-   mark the end
-   create the animated gif

The following scripts will assume that the fifo file can be found at: \`~/.local/share/mplayer/fifo\` and the output is redirected to \`~/.local/share/mplayer/output\`.


#### Mark the beggining of a subsection {#mark-the-beggining-of-a-subsection}

We can use the slave mode in order to ask the player which file is currently playing and which is the currrent position in the file.
We will save those under \`.local/share/mplayer/filename\` and \`.local/share/mplayer/beginning\`.

<a id="code-snippet--mplayer-mark-beginning"></a>
```sh
  #!/bin/bash
  echo get_property path > ~/.local/share/mplayer/fifo
  echo get_time_pos > ~/.local/share/mplayer/fifo
  sleep 1
  cat ~/.local/share/mplayer/output | grep ANS_path | tail -n 1 | cut -d "=" -f2 > ~/.local/share/mplayer/filename
  cat ~/.local/share/mplayer/output | grep ANS_TIME_POSITION | tail -n 1 | cut -d "=" -f2 > ~/.local/share/mplayer/beginning
```


#### Mark the end of a subsection {#mark-the-end-of-a-subsection}

In the same spirit we can use \`.local/share/mplayer/end\` in order to mark the end of a subsection.

<a id="code-snippet--mplayer-mark-end"></a>
```sh
  #!/bin/bash
  echo get_property path > ~/.local/share/mplayer/fifo
  echo get_time_pos > ~/.local/share/mplayer/fifo
  sleep 1
  cat ~/.local/share/mplayer/output | grep ANS_path | tail -n 1 | cut -d "=" -f2 > ~/.local/share/mplayer/filename
  cat ~/.local/share/mplayer/output | grep ANS_TIME_POSITION | tail -n 1 | cut -d "=" -f2 > ~/.local/share/mplayer/end
```


#### Bookmarking {#bookmarking}

The scripts above pretty much create bookmarks to the beginning and the end of a section within the video.
So, we can use those bookmarks to resume playback to the desired bookmark. Let's see how we can create a small script that will read \`.local/share/mplayer/beginning\` and \`.local/share/mplayer/end\` to resume playback.

<a id="code-snippet--mplayer-mark-resume"></a>
```sh
  #!/bin/bash
  BEGINNING=`cat ~/.local/share/mplayer/beginning`
  VIDEO=`cat ~/.local/share/mplayer/filename`
  mplayer "$VIDEO" -ss $BEGINNING > ~/.local/share/mplayer/output
```


#### Create an animated gif {#create-an-animated-gif}

<a id="code-snippet--mplayer-creaate-animated-gif"></a>
```sh
  #!/bin/bash
  FRAMERATE=${1:-5}
  SCALE=${2:-"512:-1"}

  BEGINNING=`cat ~/.local/share/mplayer/beginning`
  END=`cat ~/.local/share/mplayer/end`
  VIDEO=`cat ~/.local/share/mplayer/filename`

  NAME="${VIDEO%.*}"
  EXTENSION="${VIDEO##*.}"

  ffmpeg -y -i "$VIDEO" -r $FRAMERATE -vf scale=$SCALE -ss $BEGINNING -to $END "$NAME.gif" < /dev/null
```


## Key bindings {#key-bindings}

It's possible to define custom keybindings so that we assign bindings for the commands we created.
[mplayer](http://www.mplayerhq.hu/) allows users to define bindings via the \`.mplayer/input.conf\`.

For example:

```text
CTRL-f run "echo $path > /home/iocanel/.local/share/mplayer/filename"
```

This will save the path of the currently played file each time \`CTRL-f\` is pressed.


### Using custom key bindings to create animated gifs {#using-custom-key-bindings-to-create-animated-gifs}

Let's combine the commands created so far with keybindings so that we can invoke them directly from the player:

<a id="org-example-block--~-.mplayer-input.conf`"></a>
```text
CTRL-b run mplayer-mark-beggining
CTRL-e run mplayer-mark-end
CTRL-g run mplayer-create-animated-gif
```


## Thoughts {#thoughts}

So far we've seen how we can easily split really large instructionals in smaller chunks, how to use our player in order to bookmark/resume playback and how to easily create animated gifs.
Most importantly we've seen how to interact with the player from external projects, which opens up the way for many different integrations.
Future posts in the series will focus on the note taking part which in my opinion is really important in the process of studying Jiu Jitsu.


## Post index {#post-index}

-   01. Hackers guide to Jiu Jitsu: intro [wordpress version](https://iocanel.com/2021/08/hackers-guide-to-jiu-jitsu) [github version](https://github.com/iocanel/blog/tree/master/hackers-guide-to-jiu-jitsu-01-intro)
-   02. Hackers guide to Jiu Jitsu: ffmpeg [wordpress version](https://iocanel.com/2021/08/hackers-guide-to-jiu-jitsu-ffmpeg) [github version](https://github.com/iocanel/blog/tree/master/hackers-guide-to-jiu-jitsu-02-ffmpeg)
-   03. Hackers guide to Jiu Jitsu: mplayer [wordpress version](https://iocanel.com/2021/08/hackers-guide-to-jiu-jitsu-mplayer) [github version](https://github.com/iocanel/blog/tree/master/hackers-guide-to-jiu-jitsu-03-mplayer)
-   04. Hackers guide to Jiu Jitsu: markdown wiki [wordpress version](https://iocanel.com/2021/08/hackers-guide-to-jiu-jitsu-markdown-wiki) [github version](https://github.com/iocanel/blog/tree/master/hackers-guide-to-jiu-jitsu-04-markdown-wiki)
-   05. Hackers guide to Jiu Jitsu: flowcharts [wordpress version](https://iocanel.com/2022/01/hackers-guide-to-jiu-jitsu-flowcharts) [github version](https://github.com/iocanel/blog/tree/master/hackers-guide-to-jiu-jitsu-05-flowcharts)
