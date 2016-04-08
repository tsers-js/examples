
export default function main({DOM, model$: value$, title, max, min, mux}) {
  const {h} = DOM

  const vdom$ = DOM.prepare(value$.map(value =>
    h("div", [
      h("label", [
        title,
        h("input.val", {type: "range", max, min, value}),
        value
      ])
    ])))

  const mod$ = value$.set(
    DOM.events(vdom$, ".val", "input").map(e => e.target.value)
  )

  return mux({
    DOM: vdom$,
    model$: mod$
  })
}
