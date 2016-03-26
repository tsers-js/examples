import {Observable as O} from "rx"


export default function main({DOM, model$, mux}) {
  const {h} = DOM

  // we can use our model like normal observable
  const vdom$ = DOM.prepare(model$.map(counter =>
    h("div", [
      h("h1", `Counter value is ${counter}`),
      h("button.inc", "++"),
      h("button.dec", "--")
    ])))

  const incMod$ = DOM.events(vdom$, ".inc", "click").map(() => state => state + 1)
  const decMod$ = DOM.events(vdom$, ".dec", "click").map(() => state => state - 1)

  // let's merge all mods from this component
  const mod$ = O.merge(incMod$, decMod$)

  return mux({
    DOM: vdom$,
    // and make the compatible with the model
    model$: model$.mod(mod$)
  })
}
