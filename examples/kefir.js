import Kefir from "@tsers/kefir"
import TSERS from "@tsers/core"
import Snabbdom from "@tsers/snabbdom"
import Model from "@tsers/model"

import BMI from "./bmi-counter-kefir"

// start app
TSERS(Kefir, BMI, {
  DOM: Snabbdom("#app"),
  model$: Model({}, {logging: true})
})
