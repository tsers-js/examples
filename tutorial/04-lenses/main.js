import {Observable as O} from "rx"
import Hello from "../03-state-in-model/main"

export default function main(signals) {
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
