import Router from "routes"
import {Observable as O} from "rx"
import {createHashHistory} from "history"

const isObj = x => typeof x === "object" && x.constructor === Object

function makeRouterDriver(h = createHashHistory()) {
  return function RouterDriver({run, extract, compose}) {

    const location$ = O.create(o => {
      const dispose = h.listen(loc => o.onNext(loc))
      return {dispose}
    }).shareReplay(1)

    function route(in$, driverName, spec) {
      const r = new Router()
      Object.keys(spec).forEach(route => {
        r.addRoute(route, spec[route])
      })

      const path$ = extract(in$, driverName).map(l => l.pathname)
      return path$.flatMapLatest(path => {
        const res = r.match(path)
        if (!res || !res.fn) {
          return O.throw(new Error("No route found for path: " + path))
        }
        const main = res.fn
        const params$ = compose({[`${driverName}.params`]: O.just(res.params)}, null, true)
        return run(in$.merge(params$), main)
      })
    }

    function executor(location$) {
      return location$.subscribe(newPath => {
        console.log(newPath)
        h.push(isObj(newPath) ? newPath : {
          pathname: newPath
        })
      })
    }

    const transducers = {
      route
    }

    return {
      signals: location$,
      transducers,
      executor
    }
  }

}

export default makeRouterDriver
