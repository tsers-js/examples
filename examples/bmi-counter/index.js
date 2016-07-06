import {Observable as O} from "rx"
import {L} from "@tsers/model"
import Slider from "./Slider"

// Let's define the model function so that it takes the parent state
// and property containing the BMI counter state. We are making this
// BMI model as a separate function so that we could re-use it if needed
function model(model$, prop) {
  const bmiLens = L(
    prop,
    // if we don't have <prop> property yet, then use these default values
    L.defaults({weight: 80, height: 180}),
    // add "read-only" bmi property to our BMI model that is derived from weight and height
    L.augment({bmi: ({weight: w, height: h}) => Math.round(w / (h * h * 0.0001))})
  )
  return model$.lens(bmiLens)
}

export default function main(signals) {
  const {DOM, model$, demux, mux} = signals
  const {h} = DOM

  // now you could create as many BMI counters as you wish e.g.
  // const bmiA$ = model(M, "a"), bmiB$ = model(M, "b"), ...
  const bmi$ = model(model$, "myBMI")

  // actually nothing new here anymore..
  const height = Slider({...signals, model$: bmi$.lens("height"), title: "Height", min: 100, max: 220})
  const weight = Slider({...signals, model$: bmi$.lens("weight"), title: "Weight", min: 50, max: 150})

  const [{DOM: heightDOM$}, hRest$] = demux(height, "DOM")
  const [{DOM: weightDOM$}, wRest$] = demux(weight, "DOM")
  const rest$ = O.merge(wRest$, hRest$)

  const vdom$ = DOM.prepare(O.combineLatest(bmi$, heightDOM$, weightDOM$,
    // we can use our augmented "bmi" like normal property
    ({bmi}, heightVTree, weightVTree) =>
      h("div", [
        heightVTree, weightVTree,
        h("h2", `BMI is ${bmi.toFixed(2)}`)
      ])))

  return mux({DOM: vdom$}, rest$)
}
