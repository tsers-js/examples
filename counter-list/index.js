import {Observable as O} from "rx"

// we can use our counter example model directly!
import Counter from "../counter"


export default function main(signals) {
  const {DOM, model$, mux, demuxCombined} = signals
  const {h} = DOM

  // Model intepeter provides .mapListBy and .mapListById for convenient
  // list processing. These functions behave like their counter parts
  // in @tsers/core but instead of observable, the iterated item is a
  // lensed sub-model (hence enabling the usage of .lens et. al)

  // Now our model$ is a list of counter objects {id, value}. Because we
  // have the id field in our objects, we can use model$.mapListById()
  // conceptually it's almost like model$.map(list => list.map(item => ...)))
  // but with steroids - it caches items (thus the mandatory id field),
  // converts output streams to hot so that they preserve their state when
  // new items are added and manages their disposal, when the item is removed
  // from the list.
  //
  // Although the internal complexity, .mapListById is extremely easy to
  // use: it takes on transform function (like .map()) which takes two arguments
  // 1) ID of the iterated item
  // 2) Lensed sub-model of the item
  //
  // .mapListById expects that transform function returns an observable,
  // hence we can use our component function (which returns an observable of signals!)
  // and pass the item sub-model to it as model:
  const children$$ = model$.mapListById((id, counter$) =>
    // we need only counter's value, not id
    Counter({...signals, model$: counter$.lens("value")}))

  // Now the children$$ is an observable of lists containing observables, thus
  // we can't use "demux" directly to extract DOM signals. That's why TSERS provides
  // "demuxCombined" which is "demux" on steroids: it extracts the given signals,
  // combines them with Rx.Observable.combineLatest and flattens the stream so
  // that the resulting output is an observable of latest signals from the list
  // items. Those signals that are not demuxed, are merged by using Rx.Observable.merge
  // so that they can be used like demux's "rest$" observables
  const [{DOM: childrenDOM$}, rest$] = demuxCombined(children$$, "DOM")

  // now childrenDOM$ is an observable containing the latest vdom values from
  // individual counter instances
  const vdom$ = DOM.prepare(childrenDOM$.map(vdoms =>
    h("div", [
      ...vdoms.map((counterVDOM, idx) =>
        h("div", [
          counterVDOM,
          h("button.remove", {"data-idx": idx}, "Remove")
        ])),
      h("hr"),
      h("button.add", "Add counter")
    ])))

  // nothing new here, just creating modifications for the counter list model
  const mod$ = model$.mod(O.merge(
    // remove counter if counter's remove button was clicked
    DOM.events(vdom$, ".remove", "click")
      .map(e => Number(e.target.getAttribute("data-idx")))
      .map(idx => counters => counters.filter((counter, i) => idx !== i)),
    // add new counter with unique id if add button was clicked
    DOM.events(vdom$, ".add", "click")
      .map(() => counters => [...counters, {id: nextId(), value: 0}])
  ))

  return mux({
    DOM: vdom$,
    model$: mod$
  }, rest$)     // note that rest$ can be used exactly like rest$ from demux operator
}


export function nextId() {
  window.__ID = window.__ID || 0
  return ++window.__ID
}

/*

// In order to run this app, you must setup a model interpreter
// with some initial state

import TSERS from "@tsers/core"
import ReactDOM from "@tsers/react"
import Model from "@tsers/model"

import CounterList, {nextId} from "./counter-list"

TSERS(Counter, {
  DOM: ReactDOM("#app"),
  model$: Model([
    {id: nextId(), value: 0},
    {id: nextid(), value: 0}
  ])
})

*/
