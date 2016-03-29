import {L, R} from "@tsers/model"


export default function makeUndoable(state$, maxRevs = 10) {
  const Undoable = UndoableWithMaxRevs(maxRevs)

  // this first lens ensures that the lensed value is always instance of
  // Undoable. It doesn't process modifications - all modifications are propagated
  // to the state as they are
  const undoable$ = state$.lens(L.lens(
    s => Undoable.isUndoable(s) ? s : new Undoable([s]),
    next => next
  ))

  return {
    // For values we want to unwrap the Undoable instance and give an illusion that
    // we are dealing with bare values. However, if the value is modified (with either
    // .mod() or .set()), the modification is wrapped with Undoable so that we can
    // keep the revision history and update cursors properly for each modification
    value$: undoable$.lens(L.lens(
      s => s.get(),
      (a, s) => a instanceof Undoable ? a : (s instanceof Undoable ? s.update(a) : new Undoable([s, a]))
    )),
    // just simple Observable mapping
    canUndo$: undoable$.map(s => s.canUndo()),
    canRedo$: undoable$.map(s => s.canRedo()),
    mods: {
      // We can make our undo/redo modify functions from the latest "undoable" state
      undo$: undoable$.mod(undoable$.map(s => s.undoMod())).share(),
      redo$: undoable$.mod(undoable$.map(s => s.redoMod())).share()
    }
  }
}

/*
 * This is very simple undoable container having only two properties: revisions and
 * cursor. Revisions is just an array where the latest value is the most recent one.
 * The cursor just indicates the revision that'll be shown to the application:
 * cursor = 0 means that we are using the current state, cursor = 1 means that we
 * are using the state before the current one and so on...
 *
 * When state is updated, new revision is added to the end of the revisions list
 * and cursor is set to 0. If the cursor is not 0 when the update happens, all states
 * after cursor are discarded.
 *
 * This cursor have also a limit for the stored revisions. If there are more more updates
 * than the "max revision" count, the oldest revisions are discarded as soon as new
 * revisions appear.
 */
const UndoableWithMaxRevs = maxRevs => {
  class Undoable {
    constructor(revs, cursor = 0) {
      this.revs = revs
      this.cursor = cursor
    }
    get() {
      return this.revs[this.revs.length - this.cursor - 1]
    }
    update(next) {
      return this.cursor === 0 ? new Undoable(R.takeLast(maxRevs, [...this.revs, next]))
        : new Undoable([...R.take(this.revs.length - this.cursor, this.revs), next])
    }
    undoMod() {
      return () => new Undoable(this.revs, Math.min(this.revs.length - 1, this.cursor + 1))
    }
    redoMod() {
      return () => new Undoable(this.revs, Math.max(0, this.cursor - 1))
    }
    canUndo() {
      return this.cursor < this.revs.length - 1
    }
    canRedo() {
      return this.cursor > 0
    }
  }
  Undoable.prototype.__ID = UndoableID
  Undoable.isUndoable = x => x && x.__ID === UndoableID
  return Undoable
}

const UndoableID = {}
