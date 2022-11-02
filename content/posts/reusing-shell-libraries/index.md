+++
title = "Reusing shell libraries"
author = ["Ioannis Canellos"]
date = 2018-07-08T21:58:00+03:00
draft = false
+++

## Prologue {#prologue}

Every now then I see on social media people sharing the same old story: "Using shell scripting to workaround the limitations of their DevOps tools".
I've done it, my colleagues are doing it and most likely you have done it yourself.

So it seems that shell scripting is used to do the dirty work, yet its often considered by many the last resort.
If you search on the web about popular 'DevOps' tools and skills, you'll probably find:

-   [Jenkins](https://jenkins.io)
-   [Ansible](https://www.ansible.com/)
-   Git

...Which are all awesome tools, but you won't find shell scripting, ever wondered why?

Here are a couple of thoughts that come into my mind:

-   Too obvious?
-   There are syntactical differences among different Unix systems.
-   There is no good way in bundling and sharing shell code.

For me the biggest issue I have with shell scripts is that I often find myself creating the same boilerplate code again and again, cause there isn't an easy way to 'import' that code.
So, I created a small pet project that intends to make sharing shell code a treat. The tools is called [Grab](https://github.com/shellib/grab).


## Introducing: grab {#introducing-grab}

The last couple of years I played a lot with Jenkins pipeline libraries. I really enjoyed the fact that with the use of a simple annotation one could automatically fetch and reuse groovy code from github.
The approach was similar to how golang's go get fetches dependencies and it does work pretty well. What I didn't like about Jenkins pipeline, is that I had to run them inside Jenkins, which in many cases was an overkill.
Also, despite the fact that groovy is groovy, its not as popular as shell itself (it might be unappreciated, but its definitely a more common skill than groovy).
So, bringing that kind of experience to shell scripting was the main motivation behind grab.


### Using grab {#using-grab}

The shell itself does allow us to \`source\` a script as long as that script is present in the file system. Grab's mission is to get the script from the internet to the file system, so that it can be easily sourced.

```nil
source $(grab github.com/shellib/cli)
```

The command above will perform the following steps:

-   check under $HOME/.shellib for the file: github.com/shellib/cli/library.sh.
-   download the file if missing.
-   return the path so that it can be used by source.

Note: That by default grab will look for a \`library.sh\` file (see below how you can change that).


#### Requesting a custom file from a repo. {#requesting-a-custom-file-from-a-repo-dot}

In order to support repositories that doesn't conform to the convention described above (having a library.sh in the root of the repository) or to support repositories with more than shell scripts, grab support specifying the library file explicitly:

```nil
source $(grab github.com/someorg/somerepo/somedir/somefile)
```


#### Versions {#versions}

Each shell library repository may have tags. Grab allows the user to refer the tag, by appending the @ symbol followed by the tag:

```nil
source $(grab github.com/shellib/cli@1.0)
```


#### Aliasing {#aliasing}

The more scripts you grab, the more likely is to get into naming clashes. For example its likely two grabbed scripts to contain a function with the same name.
This is something that one can encounter in most modern programming languages when importing, requiring etc. One common solution is to use an alias for the imported package.
A similar technique has been added to this tool, that allows you to grab a library using a special alias, using the \`as\` keyword.

```nil
    source $(grab <git repository> as <alias>)
```

Then your code will be able to access all the functions provided by the library using the \`&lt;alias&gt;::\` prefix. Here's a real example:

source $(grab github.com/shellib/cli as cli)

It's important to clarify that the \`::\` has no spacial meaning or use in shell scripts, its just a separator that is used to separate the alias from the function name.
This is something that was inspired by my friend and co-worker [Roland Huss](https://github.com/rhuss), who uses that separator to scope functions.


#### Libraries {#libraries}

Under the shellib organization on github I've also created a couple of libraries:

-   [cli](https://github.com/shellib/cli) (common cli utilities for handling arguments and flags).
-   [wait](https://github.com/shellib/wait) (shell utilities for waiting until a condition is meet).
-   [maven](https://github.com/shellib/maven) (functions for handling maven releases).
-   [kubernetes](https://github.com/shellib/kubernetes) (work in progress library with kubernetes functions).


### Writing reusable shell libraries {#writing-reusable-shell-libraries}

It is really trivial to write a reusable shell library that will be compliant with grab.
All you need to do is to create a script that encapsulate its reusable pieces inside functions.
That script needs to be called \`library.sh\` and be placed at the root of the repository.

Also that script needs to be \`source\` friendly and that means that it shouldn't execute any code when sourced (unless of course special initialization is required).
A simple trick to have a pieces of code only executed when not sourced is the following:

```nil
  if [ "${BASH_SOURCE[0]}" == "${0}" ] || [ "${BASH_SOURCE[0]}" == "" ]; then
      #
      # Code to execute when not sourced goes here...
  fi
```


## Epilogue {#epilogue}

I hope you find it as useful as I did. If nothing else, it allows you me to organize my shell scripts into reusable bits and push them to a git repo, so that I can easily find them and reuse them next time I need them.
The \`maven\` library was the result of some work I did while working on [Syndesis](https://syndesis.io/) and I could just reuse without hassle in [Service Catalog Java API](https://github.com/snowdrop/service-catalog-java-api) (see the [release.sh](https://github.com/snowdrop/service-catalog-java-api/blob/master/release.sh) script).

I'd really like to hear your feedback and if you have shell libraries that people could reuse I'd like to know about them too.
