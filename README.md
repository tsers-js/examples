# TSERS Examples

[![Gitter](https://img.shields.io/gitter/room/tsers-js/chat.js.svg?style=flat-square)](https://gitter.im/tsers-js/chat)
[![GitHub issues](https://img.shields.io/badge/issues-%40tsers%2Fcore-blue.svg?style=flat-square)](https://github.com/tsers-js/core/issues)

## Running the examples

```bash
git clone https://github.com/tsers-js/examples.git
cd examples
npm i && npm run examples
```

## Tutorial

This tutorial is a quick walk through to `TSERS` architecture and its best
practices (at least in author's opinion). 

This tutorial assumes that you've read the **[TSERS core instroduction](https://github.com/tsers-js#introduction)**
and have understanding about RxJS. The purpose of this tutorial is not to give
teach you to program with observables. There are many great introductions and full 
length books covering that topic already. One good online introduction can be
found from **[here](https://gist.github.com/staltz/868e7e9bc2a7b8c1f754)**.

All tutorial codes can be found under the `tutorial` folder. Running the 
tutorials can be done by using terminal:

```bash
git clone https://github.com/tsers-js/examples.git
cd examples
npm run tutorial <tutorial-name>    # e.g. npm run tutorial 01-hello-world
``` 

Happy learning!


### Hello TSERS! Signals, transforms and interpreters

In TSERS, your application is divided roughly into two parts: **signal transform
function** and **interpreters**. 

The **signal transform function**, `main`, contains the actual application logic
of your application. `main` is just a *pure function* that takes input signals in and
*transforms* them into output signals. The purpose of `main` is to define the application
logic and interactions in an explicit and declarative (functional) way so that the
application doesn't need to know about implementation details of low-level things
like DOM rendering or HTTP request formats,

**Interpreters** are the bridge between the application logic and computer: they
read the application output signals and *interpret* them, causing **effects** like DOM 
rendering, interpreter's internal state changing or HTTP request sending. The purpose
of the interpreters is to **abstract the external world** so that the application doesn't
need to care whether e.g. it's virtual dom is rendered to the actual DOM (client) or
to html string (server) or what kind of transport method (HTTP, WS, something else)
is being used.

**Signals** are the backbone of TSERS applications. They are the only way to
transfer information between application, sub-applications and interpreters.
Signals in TSERS are modeled by using (RxJS) observables. Because JavaScript functions can 
return only single value, all TSERS applications return also **one stream of output signals** 
(= one observable). However, usually applications produce multiple types of signals (DOM, 
WebSocket messages, model state changes...). That's why TSERS have two core concepts: 
[multiplexing and de-multiplexing](https://en.wikipedia.org/wiki/Multiplexing).
Multiplexing (in future `mux`ing) is merging multiple signal streams into one stream
of signals so that different type of signals are identifiable from other signals. 
De-multiplexing (in future `demux`ing) is the reverse process for `mux` - it allows to
"extract" different type of signals from the `muxed` stream (note that
`demux(mux(signals)) == signals`).

But enough talk! Let's see how it looks like in code. Let's create a simple Hello
World application with TSERS:
```js
import {Observable as O} from "rx"
import TSERS from "@tsers/core"
import ReactDOM from "@tsers/react"

// define our application
function main(signals) {
  const {DOM, mux} = signals
  const {h} = DOM 

  const vdom$ = DOM.prepare(O.just(
    h("div", [
      h("h1", "Tsers!")
    ])))

  return mux({
    DOM: vdom$
  })
}

// attach interpreters and start the app
TSERS(main, {
  DOM: ReactDOM("#app")
})
``` 

Okay, lots of stuff there! Let's go it through line by line. 

First we want to import the resources we need: RxJS `Observable` functions, `TSERS` runtime
(core) and DOM interpreter (that uses `React` internally). The imported `TSERS` and `ReactDOM`
are just normal JavaScript functions that can be used to initialize the application.

Then we define our application logic, the signal transform function `main`. Note that 
`main` takes one parameter: (input) signals and transforms. The parameter is **always** an
object containing core transforms `mux` and `demux` and also signals/transforms from the
attached interpreters. Now because we are using `DOM` interpreter, we have also `DOM` in
the `signals`. Each interpreter may define its own signals and transforms. `DOM` interpreter
provides the following ones: `h`, `prepare` and `events`. 

In this example we are using `h` and `prepare`. `h` is just a hyperscript helper function 
that can be used to create virtual dom elements. `prepare` is a function that "prepares"
the produced virtual dom stream so that it can produce events (described later) and so that
the `DOM` interpreter understands the DOM output signals produced by the application.

Now that we know the meaning of `h` and `prepare`, we can create our `vdom$` signal stream:
`const vdom$ = DOM.prepare(O.just(h(...)))` Note that `prepare` expects an observable so
we must wrap the virtual dom with `Observale.just(...)`. 

Finally we must return output signals from our application. This time we are lucky: we 
have only `DOM` type signals. However, we want to sure that our application scales later,
we must multiplex the output signals so that we can add signals with different type later.
Multiplexing can be done by using core transform function `mux` that can be found from
the `signals` parameter. The contract of `mux` is simple: give the signals you want to 
multiplex and place them into an object so that object keys represent the type of the
muxed signals. And that's it. Now we want to mux only `DOM` type signals so we define an
object with `DOM` as key and `vdom$` signals as value and pass that object to `mux`.

After everything else is done, we must start the application. That can be done by using
`TSERS` function from the `@tser/core` package. It takes two arguments: the application
`main` function and interpreters that'll be attached to the application. The interpreters
are defined as an object where object keys identify the individual interpreters. Note that
we are using the same `DOM` key to define our interpreter as we are using in our 
application code. Behind that `DOM` key, we are using `ReactDOM` interpreter implementation:
`ReactDOM` is a factory function that creates the actual interpreter that renders the
DOM under the given HTML element (`#app` in this example).

And that's it! Your first application with TSERS!


### User events as signals

Okay. UI application is not very useful without any user actions. Let's add some
interaction to our application!

In TSERS, UI actions are nothing more that signal transformations: now that you have
a virtual dom signals, wouldn't it be logical to derive some user event signals from
those virtual dom signals? That's what we're doing next.

Remember that you "prepared" the vdom stream by using `DOM.prepare` in the previous
section? Prepared vdom streams, you see, are able to emit user events by using 
`DOM.events` transform. `DOM.events` takes three parameters: the prepared virtual
dom stream, CSS selector that must match the elements you want to listen and the
event type (e.g. `click`, `change`, `input`...) you want to listen.

Let's add a button to our `main` and listen to its click events:
```diff
function main(signals) {
  const {DOM, mux} = signals
  const {h} = DOM 

  const vdom$ = DOM.prepare(O.just(
    h("div", [
      h("h1", "Tsers!"),
      h("button.btn", "Click me!")
    ])))
    
+ const click$ = DOM.events(vdom$, ".btn", "click")

  return mux({
    DOM: vdom$
  })
}
``` 

Hmmm, nothing happened?! That's because we are not using those click events anywhere
in our application. Let's make those clicks to add `!` to your message every time
when the button is clicked!

Now you may notice a problem: in order to get `click$`, you must have `vdom$`, but
in order to modify `vdom$` you must have `click$`. What to do? Luckily TSERS provides
another helper transform: `loop`. 

`loop` is a way to loop signals from "end" back to "beginning". It takes two arguments:
`input$` and `loopFn`. `input$` is the input signal stream that comes outside the loop.
`loopFn` is the function that run inside the loop - it receives `input$` signals as 
parameter and must return an array `[output$, loop$]` where `output$` signals are passed
out from the loop and `loop$` signals are brought back and merged to `input$` signals.

Although the concept may sound difficult, the actual usage is not. Let's apply 
`loop` to our application:
```js
function main(signals) {
  const {DOM, mux, loop} = signals
  const {h} = DOM

  const initialText$ = O.just("Tsers").shareReplay(1)
  const vdom$ = loop(initialText$, text$ => {
    const vdom$ = DOM.prepare(text$.map(text =>
      h("div", [
        h("h1", text),
        h("button", "Click me!")
      ])))

    const click$ = DOM.events(vdom$, "button", "click")
    const updatedText$ = click$
      .withLatestFrom(text$, (_, text) => text + "!")
      
    return [vdom$, updatedText$]
  })

  return mux({
    DOM: vdom$
  })
}
```

First we define the initial text and pass it to the loop as input. Then we can
use the input signals as text for our virtual dom. When clicks happen, they take
the latest value of the text and add `!` into that value. The updated text signals
are looped back as `text$` stream values so that the virtual dom is re-created
every time when the text changes. The created `vdom$` stream is passed out from
the loop so that we can mux and return it to the interpreters.

Phew! That was a bit more complicated, wasn't it? If you didn't get it yet, don't
panic. Read the section again few times and it'll begin to open. :smile: And don't
worry about the complexity. This section was to introduce you some basic concepts
of TSERS. The actual state handling in idiomatic TSERS can be done much easier way
as you'll notice in the next part of this tutorial. :wink:


### Putting the application state inside Model interpreter

The `loop` function was a little bit overwhelming? I think so too. Fortunately
it's just signal processing so we can externalize it. :wink: And that's why TSERS
provides the **Model interpreter** fot the job! It basically does all that looping
stuff and provides a nice interface to access the state and to modify it.

Let's attach a model interpreter with some initial value:
```js 
import TSERS from "@tsers/core"
import ReactDOM from "@tsers/react"
import Model from "@tsers/model"

// ...

TSERS(main, {
  DOM: ReactDOM("#app"),
  model$: Model("Tsers")      // use initial value "Tsers"
})
``` 

#### Listening the state changes

Now the state lives in the model interpreter `model$` which is just an observable 
that you can use like any other observable in TSERS:

```js
function main(signals) {
  const {DOM, model$: text$, mux} = signals
  const {h} = DOM

  const vdom$ = DOM.prepare(text$.map(text =>
    h("div", [
      h("h1", text)
    ])))

  return mux({
    DOM: vdom$
  })
}
```

Not bad, huh? Let's go forward!

#### Modifying the state 

Now you know how to listen to the state changes. Let's take a look how to modify it. 

Model interpreter accepts state changes as **modify output signals**. A modify 
output signal is an observable of functions `currentState => newState`. But like
with `DOM` interpreter, those modify functions must be prepared so that the model
interpreter can understand them. That's why model interpreter provides `mod` 
transform that does the conversion. Let's make the text editable!

```js
import {Observable as O} from "rx"

export default function main(signals) {
  const {DOM, model$: text$, mux} = signals
  const {h} = DOM

  const vdom$ = DOM.prepare(text$.map(text =>
    h("div", [
      h("h1", text),
      h("button", "Click me!")
    ])))

  const click$ = DOM.events(vdom$, "button", "click")
  const updateMod$ = text$.mod(
    click$.map(() => text => text + "!")
  )

  return mux({
    DOM: vdom$,
    model$: updateMod$
  })
}
``` 

Looks very similar what you've already done with `DOM` interpreter? It should
be, it's just signal processing - it's TSERS!

Although the previous example might look a bit overwhelming at the first glance,
don't worry. Once you learn that, the hardest part is over. Basically all TSERS
applications (regardless how complex they are) reduce into same primitive 
operations - knowing how to create simple applications with TSERS is knowing how
to create complext apps as well!


### Accessing sub-states by using lenses

Now you know how to create an application with TSERS. Let's see next, how to 
create complex applications by composing your "simple" TSERS applications.

Because TSERS applications are just pure signal transform functions, you can
call them inside other signal transform functions (applications) like any other
function! However, usually might you want the the "sub-application" sees only
a part of the "global state" so that modifications to that sub-state reflect 
also to the global state.

That's why TSERS model interpreter provides the `lens` transform. It creates
exactly same model interpreter instance as the parent model but so that the
"lensed model" sees only the lensed part of the state. 

Internally `lens` uses [`partial.lenses`](https://github.com/calmm-js/partial.lenses). 
In order to understand lenses better, you have to take a look at `partial.lenses` docs. 
For now you can just treat them like property getters `const a = model$.lens("a")`.

Let's see how we could create two hello world texts that append `!` every time
when the application's button is clicked.

First we have to change the initial state for our interpreter so that instead of
string (text), it contains an object of two strings (texts):
```js
TSERS(main, {
  DOM: ReactDOM("#app"),
  model$: Model({hello: "Hello", world: "Tsers"})
})
```

Then let's create new application `main` and use our `Hello.js` main implementation
so that we create a sub-model for both `hello` and `world` property and use them
as a model for the `Hello` application:

```js
import Hello from "./Hello"

function main(signals) {
  const {DOM, model$, mux, demux} = signals
  const {h} = DOM

  const hello$ = Hello({...signals, model$: model$.lens("hello")})
  const world$ = Hello({...signals, model$: model$.lens("world")})

  const [{DOM: helloDOM$}, helloRest$] = demux(hello$, "DOM")
  const [{DOM: worldDOM$}, worldRest$] = demux(world$, "DOM")
  const rest$ = O.merge(helloRest$, worldRest$)

  const vdom$ = DOM.prepare(O.combineLatest(helloDOM$, worldDOM$,
    (helloDOM, worldDOM) =>
      h("div", [
        helloDOM, worldDOM
      ])))

  return mux({DOM: vdom$}, rest$)
}
```

Okay, there are few new things that we haven't covered yet. First, notice that we
are using our `Hello` like any other function: we pass the parent's input signals
to it **but** also override `model$` signals so that the `Hello` applications don't
see the whole parent state but only a part of it (`hello` and `world` properties).

The second new thing is **demuxing**. As you know, TSERS applications return a
*stream of output signals*. `Hello` is no exception, so we can capture the output
signals to variables `hello$` and `world$`. However, those output signals contain
both `DOM` signals and `model$` signals. We are only interested in `DOM` signals
(so that we can combine them and insert them into parent's vdom) so we need to
**demux** the output signals. TSERS provide a core function `demux` that takes the
signal stream and list of keys (`"DOM"` in the example) that'll be demuxed and
returns the demuxed signals as an object by their keys and rest of the signals
that were not demuxed. In ES6, you can destructure the return value so that you
don't need to keep any intermediate values (if you don't want).

The `vdom$` construction part should have nothing new - we just combine the DOM
signals from the child components and use their latest values to construct the
parent's DOM output signals.

The last new thing is that we are passing `rest$` stream as a second parameter to
the `mux` transform. Yes. If you wouldn't, then the output signals (i.e. state
modifications) from child components would reach the interpreters, resulting that
nothing happens although the UI buttons are clicked. 

Congrats! Your first composed "complex" application is ready! And as you can see, 
there was **no changes** to the original `Hello` component at all! That's the true
[fractal architecture](http://staltz.com/unidirectional-user-interface-architectures.html)
by design! At this point, there is nothing new for you to learn: onwards, it's
just repeating these patterns and composing them in order to create bigger and
more complex applications.


### Processing list states by using lenses (again)

#### Mapping a list model to an observable of output signals

Lists are a little bit more complicated thing... just kidding! With TSERS, 
list processing is *almost*  as easy as processing a predefined number
of nested components. 

What is "list state"? It's an observable emitting events that contain arrays 
with arbitrary number of items. If those items having an **unique key** (e.g. `id`),
TSERS model interpreter provides `mapListById` transform that makes the
list processing extremely easy.

Conceptually `mapListById` is almost like (but bumped with steroids :muscle:):
```js 
list$.map(items => items.map(item => fn(item.id, item)))
``` 

The transform function that is passed to `mapListById` should invoke some (child)
application function and return the output signals from the child application. 
The transformer function receives item id as a first parameter and *the lensed 
item state* as a second parameter. 

The code is far more simpler than the explanation. Let's create a list of 
Hello world applications! First we need to modify the initial state of our
model interpreter:
```js
TSERS(main, {
  DOM: ReactDOM("#app"),
  model$: Model([
    {id: nextId(), text: "Hello"},
    {id: nextId(), text: "Tsers"}
  ])
})

function nextId() {
  window.__ID = window.__ID || 0
  return ++window.__ID
}
```

Note that list items must have an unique `id` property, thus we're using
the `nextId` helper function.

Now let's try to use `mapListById` in order to render the `Hello` 
sub-applications for those list items.
```js
function main(signals) {
  const {DOM, model$, mux} = signals
  const {h} = DOM

  const children$$ = model$.mapListById((id, item$) =>
    Hello({...signals, model$: item$.lens("text")}))
  // ...
}
``` 

Note that `item$` is a model that can be passed to child application directly
as a model interpreter. `Hello` application expects the model to be a string
(text value) so we need to get the `text` property by using lens (should be 
nothing new here, huh?).

#### Extracting values from output signal arrays

Well.. now you have an observable that contains a list of child application
output signals. But how to extract those signals? `demux` doesn't work because
we are dealing list of signals. Luckily TSERS have another core transform
for this kind of situation: `demuxCombined`!

`demuxCombined` has the same API contract as `demux` but instead of bare output
signals, `demuxCombined` handles a *list of output signals*. The name already
implies the extraction strategy: after the output signals are extracted by using
the given keys, their latest values are combined by using `Observable.combineLatest`,
thus resulting an observable that produces a list of latest values from the
extracted output signals. Rest of the signals are flattened and merged by using
`Observable.merge` so the return value of `demuxCombined` is identical with 
`demux` (hence can be used in the same way when muxing child signals to parent's
output signals).

Let's see how to use `demuxCombined` in practice and finish our example:
```js
function main(signals) {
  const {DOM, model$, mux, demuxCombined} = signals
  const {h} = DOM

  const children$$ = model$.mapListById((id, item$) =>
    Hello({...signals, model$: item$.lens("text")}))

  const [{DOM: childDOMs$}, rest$] = demuxCombined(children$$, "DOM")

  const vdom$ = DOM.prepare(childDOMs$.map(childDOMs =>
    h("div", [
      ...childDOMs.map((vdom, idx) =>
      h("div", [
        vdom,
        h("button.rm", {"data-idx": idx}, "Remove")
      ])),
      h("hr"),
      h("button.add", "Add new greeting!")
    ])))

  const addMod$ = DOM.events(vdom$, ".add", "click")
    .map(() => items => [...items, {id: nextId(), text: "Tsers"}])
  const rmMod$ = DOM.events(vdom$, ".rm", "click")
    .map(e => Number(e.target.getAttribute("data-idx")))
    .map(idx => items => items.filter((_, i) => i !== idx))

  const mod$ = model$.mod(O.merge(addMod$, rmMod$))

  return mux({
    DOM: vdom$,
    model$: mod$
  }, rest$)
}
``` 

As you can see, using `demuxCombined` is quite straightforward: it takes the result
of `mapListById` as a first parameter and after that the "extracted" signal keys just
like `demux`. The only difference is that the extracted streams contain arrays (like
`childDOMs`) instead of scalar values. 
 
The rest of the application should contain nothing new.

**And that's it!** Now you know how to create complex apps with TSERS. The rest is just 
composing and combining the basic cases we just covered. If you didn't get it now, don't 
worry - read this tutorial again (and again) and take a look at the other examples too. 
It might take some time to learn these all new things like (de)muxing, signals, lenses and 
modifications but it's definitely worth it!

If you have any more questions or problems, please join to the 
**[TSERS Gitter chat room](https://gitter.im/tsers-js/chat)**. Let's continue
the discussion there!


## License

MIT
