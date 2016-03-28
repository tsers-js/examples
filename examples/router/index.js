import Routes from "routes"
import {Observable as O} from "rx"
import {createHashHistory} from "history"

const isObj = x => typeof x === "object" && x.constructor === Object
const objKeys = x => Object.keys(x || {})


function makeRouter(h = createHashHistory()) {
  return function Router() {
    const location$ = O.create(o => {
      const dispose = h.listen(loc => o.onNext(loc))
      return {dispose}
    }).shareReplay(1)

    function route(signals, spec) {
      const r = new Routes()
      objKeys(spec).forEach(route => {
        r.addRoute(route, spec[route])
      })

      const path$ = location$.map(l => l.pathname.replace(/^#/, ""))
      return path$
        .flatMapLatest(path => {
          const res = r.match(path)
          if (!res || !res.fn) {
            return O.throw(new Error("No route found for path: " + path))
          }
          const main = res.fn
          return main(signals)
        })
        .shareReplay(1)
    }

    const Signals = {route}

    function executor(route$) {
      return route$.subscribe(route => {
        h.push(isObj(route) ? route : {pathname: route})
      })
    }

    return [Signals, executor]
  }

}

export default makeRouter
