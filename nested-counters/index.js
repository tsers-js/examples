import {Observable as O} from "rx"

// we can use our counter example model directly!
import Counter from "../counter"


export default function main(signals) {
  const {DOM, model$, mux, demux} = signals
  const {h} = DOM

  // we can access model's sub-states by using .lens() which creates
  // an identical model$ instance but so that the it sees only the
  // partial (lensed) state from the original model

  // if lensed model is changed via modifications (the same way as
  // model$), changes are propagated to the parent model too. Also
  // if parent model gets changed, also lensed model gets changed

  // create two sub-models, one from property "a", another from
  // property "b"
  const a$ = model$.lens("a")
  const b$ = model$.lens("b")

  // and because sub-models are fully compatible models, we can use
  // them as models to the nested components ;-)
  const aOut$ = Counter({...signals, model$: a$})
  const bOut$ = Counter({...signals, model$: b$})

  // because aOut$ and bOut$ are streams for signals, we must demux
  // their DOM signals so that we can post-process them (add our own
  // vdom around them)
  const [{DOM: aDOM$}, aRest$] = demux(aOut$, "DOM")
  const [{DOM: bDOM$}, bRest$] = demux(bOut$, "DOM")

  // we are not interested in other signals so just merge them and
  // mux with the signals of this component (see return statement)
  const rest$ = O.merge(aRest$, bRest$)

  // now aDOM$ and bDOM$ are normal streams containing virtual DOM
  // instances so we can combine them and post-process them inside
  // this component
  const vdom$ = DOM.prepare(O.combineLatest(model$, aDOM$, bDOM$,
    (model, aDOM, bDOM) =>
      h("div", [
        aDOM, bDOM,
        h("hr"),
        // we can use a and b values via model. we could've also used
        // a$ and b$ instead of model$ and had a same result
        h("h2", `Total: ${model.a + model.b}`),
        h("button.reset", "Reset counters")
      ])))

  // when reset button is clicked, set a and b counter values to zero
  const resetMod$ = model$.set(
    DOM.events(vdom$, ".reset", "click").map(() => ({a: 0, b: 0}))
  )

  return mux({
    DOM: vdom$,
    model$: resetMod$
  }, rest$)   // add child signals to muxed output signals
}
