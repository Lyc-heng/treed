
var movement = require('../../util/movement')

module.exports = {
  keys: {
    'remove': {}, // not using this
    'cut': {
      'normal': 'd d, shift+d, ctrl+x, delete',
      'visual': 'd, shift+d, ctrl+x, delete',
      // 'insert': 'ctrl+x',
    },
    'copy': {
      'normal': 'y y, shift+y, ctrl+c',
      'visual': 'y, shift+y, ctrl+c',
      // 'insert': 'ctrl+c',
    },
    'paste': {
      'normal': 'p, ctrl+v',
      'visual': 'p, ctrl+v',
      // 'insert': 'ctrl+v',
    },
    'paste above': {
      'normal': 'shift+p',
      'visual': 'shift+p',
    },
  },

  store: {
    init: function (store) {
      store._globals.clipboard = null
    },

    actions: {
      copy: function (id) {
        id = id || this.view.active
        if (this.view.mode === 'visual') {
          ids = this.view.selection
          this.setMode('normal', true)
        } else {
          ids = [id]
        }
        this.globals.clipboard = this.db.exportMany(ids)
      },

      cut: function (id) {
        id = id || this.view.active
        if (id === this.view.root) return
        if (this.view.mode === 'visual') {
          ids = this.view.selection
          next = movement.down(ids[ids.length - 1], this.view.root, this.db.nodes, true)
          this.setMode('normal', true)
        } else {
          ids = [id]
          next = movement.down(id, this.view.root, this.db.nodes, true)
        }
        if (!next) {
          next = movement.up(id, this.view.root, this.db.nodes)
        }
        if (this.view.mode === 'insert') {
          document.activeElement.blur()
        }
        this.view.active = next
        this.globals.clipboard = this.db.exportMany(ids)
        this.executeCommand('remove', {ids: ids})
        this.changed(this.events.nodeChanged(next))
      },

      paste: function (id) {
        if (!this.globals.clipboard) return
        id = id || this.view.active
        var node = this.db.nodes[id]
          , pid
          , ix
        if ((node.children.length && !node.collapsed) || id === this.view.root) {
          pid = id
          ix = 0
        } else {
          pid = node.parent
          ix = this.db.nodes[pid].children.indexOf(id) + 1
        }
        var cState = this.executeCommand('importTrees', {
          pid: pid,
          index: ix,
          data: this.globals.clipboard
        })
        if (cState.created.ids.length > 1) {
          this.setMode('visual')
          this.setSelection(cState.created.ids)
        }
        this.setActive(cState.created.ids[0])
      },

      pasteAbove: function (id) {
        if (!this.globals.clipboard) return
        id = id || this.view.active
        var node = this.db.nodes[id]
          , pid = node.parent
          , ix = this.db.nodes[pid].children.indexOf(id)
        var cState = this.executeCommand('importTrees', {
          pid: pid,
          index: ix,
          data: this.globals.clipboard
        })
        if (cState.created.ids.length > 1) {
          this.setMode('visual')
          this.setSelection(cState.created.ids)
        }
        this.setActive(cState.created.ids[0])
      },
    },
  },
}

