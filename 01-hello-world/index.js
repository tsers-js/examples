import {Observable as O} from "rx"

const main = T => in$ => {
  const {DOM: {h, prepare, events}, decompose, compose} = T

  const [actions] = decompose(in$, "add$")
  return intent(view(model(actions)))

  function model({add$}) {
    const msg$ = add$
      .map(() => "!")
      .startWith("Tsers")
      .scan((acc, s) => acc + s)
    return msg$
  }

  function view(msg$) {
    const vdom$ = msg$.map(msg =>
      h("div", [
        h("h1", msg),
        h("button.add", "Click me!")
      ]))
    return prepare(vdom$)
  }

  function intent(vdom$) {
    const add$ = events(vdom$, ".add", "click")
    const loop$ = compose({add$})
    const out$ = compose({DOM: vdom$})
    return [out$, loop$]
  }
}

export default main
