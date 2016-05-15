/**  Unsplashed - FamousJS Image Puzzle Concept Game (Work In Progress)
 *   Author: Farias Maiquita http://codepen.io/fariasmaiquita/
 *   License: GNU GPLv3
 */

'use strict';

// Famous dependencies

var FamousEngine = famous.core.FamousEngine,
    Clock = FamousEngine.getClock(),
    Node = famous.core.Node,
    Camera = famous.components.Camera,
    Position = famous.components.Position,
    Rotation = famous.components.Rotation,
    Scale = famous.components.Scale,
    DOMElement = famous.domRenderables.DOMElement;


// Puzzle App Module

function PuzzleApp(contextSize) {
  Node.call(this);
  this.el = new DOMElement(this, { classes: ['puzzle-app'] });
  
  var rootNode = this;

  this.contextSize = contextSize;

  // Menu Elements
  this.menu = this.addChild(new Menu());
  this.winStatsNode = this.menu.plaques[5].columns[1].rows[1].content;
  this.lossStatsNode = this.menu.plaques[5].columns[2].rows[1].content;
  this.resumePuzzleBtn = this.menu.plaques[6].buttons[0];
  this.newPuzzleBtn = this.menu.plaques[6].buttons[1];
  
  // Puzzle Elements
  this.puzzle = this.addChild(new Puzzle(contextSize[0]));
  this.backBtn = this.puzzle.plaques[1].buttons[0];
  this.snapBtn = this.puzzle.plaques[1].buttons[1];
  this.movesCounter = this.puzzle.plaques[3].columns[1].content;

  // Testing Some Event Listeners
  this.resumePuzzleBtn.addComponent({
    onMount: function(node) {
      node.el.addClass('inactive');
    }
  });
  this.newPuzzleBtn.addComponent({
    onMount: function(node) {
      node.addUIEvent('click');
    },
    onReceive: function(e, payload) {
      if (e === 'click') { rootNode.newGame(); }
    }
  });
  this.backBtn.addComponent({
    onMount: function(node) {
      node.addUIEvent('click');
    },
    onReceive: function(e, payload) {
      if (e === 'click') {
        rootNode.puzzle.transitionTo(rootNode.menu);
      }
    }
  });
  try {
    this.movesCounter.addComponent({
      onMount: function(node) {
        node.setContent({ text: '36' });
      }
    });
  } catch(e) {}

  _bindPuzzleAppEvents.call(this);
}

PuzzleApp.prototype = Object.create(Node.prototype);

PuzzleApp.prototype.newGame = function() {
  var rootNode = this;
  for (var i = 0; i < this.puzzle.board.pieces.length; i++) {
    this.puzzle.board.pieces[i].scaleTweener.set(0, 0, 1);
  }
  this.menu.transitionTo(this.puzzle, function() {
    rootNode.puzzle.newImage();
  });
}


function View() {
  Node.call(this);
  this.el = new DOMElement(this, { classes: ['view'] });
  this.plaques = [];
  this.scaleTweener = new Scale(this);

  this.scaleTweener.set(.75, .75, 1);
  this.setAlign(0.5, 0.5);
  this.setMountPoint(0.5, 0.5);
  this.setOrigin(0.5, 0.5);
}
View.prototype = Object.create(Node.prototype);

View.prototype.resetPlaquesRotation = function() {
  for (var i = 0; i < this.plaques.length; i++) {
    var rotationTweener = new Rotation(this.plaques[i]);
    rotationTweener.set(-Math.PI, 0, 0);
  }
}

View.prototype.transitionIn = function() {
  var viewNode =  this;
  Clock.setTimeout(function() {
    viewNode.animatePlaques(1, 0, 'outCirc', 900);
  }, 300);
}

View.prototype.transitionTo = function(otherView, onCompleteFn) {
  var thisView = this;
  this.animatePlaques(.75, Math.PI, 'inCirc', 600, function() {
    thisView.el.addClass('hidden');
    thisView.resetPlaquesRotation();
    otherView.el.removeClass('hidden');
    otherView.animatePlaques(1, 0, 'outCirc', 600, onCompleteFn);
  });
}

View.prototype.animatePlaques = function(scaleXY, rotationX, easing, tweenDuration, onCompleteFn) {
  this.scaleTweener.set(scaleXY, scaleXY, 1, {
    duration: tweenDuration,
    curve: easing
  }, function() {
    try { onCompleteFn(); } catch(e) {}
  });
  
  for (var i = 0; i < this.plaques.length; i++) {
    var rotationTweener = new Rotation(this.plaques[i]);
    rotationTweener.set(rotationX, 0, 0, {
      duration: tweenDuration,
      curve: easing
    });
  }
}



function Puzzle(contextWidth) {
  View.call(this);
  this.el.addClass('puzzle').addClass('hidden');
  this.plaques = [
    this.addChild(new Plaque(1/16, null)),
    this.addChild(new Plaque(2.5/16, { buttons: [
      { text: 'Back to Menu', width: 17/40 },
      { text: 'Snap!', class: 'inactive', width: 8/40 }
    ]})),
    this.addChild(new Plaque(9/16, { node: new Board(3, contextWidth) })),
    this.addChild(new Plaque(2.5/16, [
      { text: 'Moves<br>Remaining', class: 'align-right', width: 1/2 },
      { text: '&mdash;', class: 'heading indented', width: 1/2 }
    ])),
    this.addChild(new Plaque(1/16, null))
  ];
  this.board = this.plaques[2].child;
  this.plaques[2].el.setProperty('zIndex', 2);
}
Puzzle.prototype = Object.create(View.prototype);

Puzzle.prototype.newImage = function() {
  var board = this.board;
  board.el.addClass('loading');
  Clock.setTimeout(function() {
    board.el.removeClass('loading');
    board.setupPuzzle('image_squared.jpg');
  }, 1000);
}



function Menu() {
  View.call(this);
  this.el.addClass('menu');
  this.plaques = [
    this.addChild(new Plaque(1/8, { icon: 'crop' })),
    this.addChild(new Plaque(1/8, { text: 'Unsplashed', class: 'heading' })),
    this.addChild(new Plaque(1/8, [
      { icon: 'redo', width: 2/9 },
      { text: 'Tap pieces to rotate them 90 degrees clockwise', width: 6.6/9 }
    ])),
    this.addChild(new Plaque(1/8, [
      { icon: 'move', width: 2/9 },
      { text: 'Drag and drop pieces to swap their positions', width: 6.6/9 }
    ])),
    this.addChild(new Plaque(1/8, [
      { icon: 'hourglass', width: 2/9 },
      { text: 'Beware of the moves counter, moves are not unlimited', width: 6.6/9 }
    ])),
    this.addChild(new Plaque(1/8, [
      { icon: 'pie-chart', width: 2/9 },
      { rows: [{ text: 'Win Stats' }, { text: '&mdash;' }], width: 3.3/9 },
      { rows: [{ text: 'Loss Stats' }, { text: '&mdash;' }], width: 3.3/9 }
    ])),
    this.addChild(new Plaque(1/8, { buttons: [
      { text: 'Resume Puzzle', width: 17/40 },
      { text: 'New Puzzle', width: 17/40 }
    ]})),
    this.addChild(new Plaque(1/8, { icon: 'crop' }))
  ];
  this.transitionIn();
}
Menu.prototype = Object.create(View.prototype);

function Plaque(height, contents) {
  Node.call(this);
  this.el = new DOMElement(this, { classes: ['plaque', 'relative'] });
  this.setOrigin(0.5, 0.5);
  this.setRotation(-Math.PI, 0, 0);
  this.setProportionalSize(1, height);
  
  var mainContents = (contents && contents.main) ? contents.main : contents,
      onflipContents = (contents && contents.onflip) ? contents.onflip : null;

  var setupElements = function (contentSet, container) {
    if (contentSet.constructor === Array) {
      container.el.addClass('children-float');
      container.columns = [];
      for (var i = 0; i < contentSet.length; i++) {
        var column = container.addChild(),
            width = contentSet[i].width || 1;
        column.el = new DOMElement(column, { classes: ['column', 'relative'] });
        column.setProportionalSize(width, 1);
        if (contentSet[i].rows) {
          column.rows = [];
          for (var j = 0; j < contentSet[i].rows.length; j++) {
            var row = column.addChild();
            row.el = new DOMElement(row, { classes: ['row', 'relative'] });
            row.setProportionalSize(1, 1/contentSet[i].rows.length);
            row.content = row.addChild(new Content(contentSet[i].rows[j]));
            column.rows.push(row);
          }
        } else {
          column.addChild(new Content(contentSet[i]));
        }
        container.columns.push(column);
      }
    } else if (contentSet.buttons) {
      container.el.addClass('children-centered');
      container.buttons = [];
      for (var i = 0; i < contentSet.buttons.length; i++) {
        container.buttons.push(container.addChild(new Button(contentSet.buttons[i])));
      }
    } else if (contentSet.icon || contentSet.text) {
      container.content = container.addChild(new Content(contentSet));
    } else if (contentSet.node) {
      container.child = container.addChild(contentSet.node);
    }
  };

  if (mainContents) {
    setupElements(mainContents, this);
  }
  if (onflipContents) {
    this.onflipContainer = this.addChild();
    this.onflipContainer.el = new DOMElement(this.onflipContainer, { classes: ['on-flip'] });
    setupElements(onflipContents, this.onflipContainer);
  }
}
Plaque.prototype = Object.create(Node.prototype);

function Content(details) {
  Node.call(this);
  this.el = new DOMElement(this, { classes: ['relative'] });
  this.setContent(details);
}
Content.prototype = Object.create(Node.prototype);

Content.prototype.setContent = function(newContent) {
  var contentStr = '<div class="children-centered">',
      contentClass = newContent.class || '';

  if (newContent.icon) {
    contentStr += '<svg class="lnr lnr-' + newContent.icon + '">';
    contentStr += '<use xlink:href="#lnr-' + newContent.icon + '"></use></svg>';
  } else if (newContent.text) {
    contentStr += '<span class="text ' + contentClass + '">';
    contentStr += newContent.text + '</span>';
  }

  contentStr += '</div>';
  this.el.setContent(contentStr);
}


function Button(details) {
  Node.call(this);
  this.el = new DOMElement(this, {
    tagName: 'button',
    classes: ['relative'],
    attributes: { style: 'display:inline-block' },
    content: '<span>' + details.text + '</span>'
  });
  this.setSizeMode('relative', 'render');
  this.setProportionalSize(details.width, 1);
  if (details.class) {
    this.el.addClass(details.class);
  }
}
Button.prototype = Object.create(Node.prototype);


// UNTOUCHED CODE STARTS HERE //


function _bindPuzzleAppEvents() {
  var rootNode = this,
      pieces = []; //this.board.pieces;

  this.addUIEvent('mousemove');
  this.addUIEvent('touchmove');
  this.addUIEvent('mouseup');
  this.addUIEvent('touchend');

  this.addComponent({
    onReceive: function (e, payload) {

      if ((e === 'mousedown' || e === 'touchstart') && (payload.node.constructor === Piece)) {
        var toMoveNode = payload.node,
            initX = (e === 'touchstart') ? payload.touches[0].clientX : payload.clientX,
            initY = (e === 'touchstart') ? payload.touches[0].clientY : payload.clientY;

        rootNode.childToMove = {
          node: toMoveNode,
          nodeWidth: rootNode.contextSize[0] / rootNode.puzzle.board.piecesPerRow,
          swapingNode: null,
          deltaX: initX - toMoveNode.getPosition()[0],
          deltaY: initY - toMoveNode.getPosition()[1]
        };

        toMoveNode.el.addClass('in-motion');
        toMoveNode.scaleTweener.set(1.2, 1.2, 1, {
          duration: 100,
          curve: 'easeIn'
        });
      }

      if ((e === 'mousemove' || e === 'touchmove') && rootNode.childToMove) {         
        var clientX = (e === 'touchmove') ? payload.touches[0].clientX : payload.clientX,
            clientY = (e === 'touchmove') ? payload.touches[0].clientY : payload.clientY,
            movingNode = rootNode.childToMove.node,
            moveX = clientX - rootNode.childToMove.deltaX,
            moveY = clientY - rootNode.childToMove.deltaY,
            nodeWidth = rootNode.childToMove.nodeWidth,
            startingX = movingNode.xIndex * nodeWidth,
            startingY = movingNode.yIndex * nodeWidth,
            pieces = rootNode.puzzle.board.pieces;
          
        movingNode.hasMoved = true;
        movingNode.setPosition(moveX, moveY);

        rootNode.childToMove.swapingNode = null;
        for (var i = 0; i < pieces.length; i++) {
          var minX = pieces[i].xIndex * nodeWidth - nodeWidth/2,
              maxX = minX + nodeWidth,
              minY = pieces[i].yIndex * nodeWidth  - nodeWidth/2,
              maxY = minY + nodeWidth,
              movingOver = minX <= moveX && moveX < maxX && minY <= moveY && moveY < maxY;

          if (movingOver && movingNode != pieces[i]) {
            if (!pieces[i].hoverActivated) {
              pieces[i].hoverActivated = true;
              pieces[i].scaleTweener.set(0.8, 0.8, 1, {
                duration: 100,
                curve: 'easeIn'
              });
            }
            rootNode.childToMove.swapingNode = pieces[i];
          } else {
            if (pieces[i].hoverActivated) {
              pieces[i].hoverActivated = false;
              pieces[i].scaleTweener.set(1, 1, 1, {
                duration: 100,
                curve: 'easeOut'
              });
            }
          }
        }
      }

      if ((e === 'mouseup' || e === 'touchend')) {
        if (rootNode.childToMove) {
          if (rootNode.childToMove.node.hasMoved) {
            var movedNode = rootNode.childToMove.node,
                swappedNode = rootNode.childToMove.swapingNode,
                nodeWidth = rootNode.childToMove.nodeWidth;

            movedNode.swapAfterDrag(swappedNode, nodeWidth);

          } else {
            rootNode.childToMove.node.rotate();
          }
          rootNode.childToMove.node.hasMoved = false;
          rootNode.childToMove = null;
        }
      }
    }.bind(this)
  });
}


// Board Module

function Board(piecesPerRow, boardWidth) {
  Node.call(this);
  _centerNode.call(this);
  
  this.piecesPerRow = piecesPerRow;
  this.boardWidth = boardWidth;
  this.setAbsoluteSize(boardWidth, boardWidth);
  this.el = new DOMElement(this, { classes: ['board'] });
  
  this.pieces = [];
  this.indexedLocations = [];
  
  for (var y = 0; y < piecesPerRow; y++) {
    for (var x = 0; x < piecesPerRow; x++) {
      this.pieces.push(this.addChild(new Piece(x, y, piecesPerRow, boardWidth)));
    }
  }
}
Board.prototype = Object.create(Node.prototype);

Board.prototype.setupPuzzle = function(imageUrl) {
  
  for (var i = 0, length = this.pieces.length; i < length; i++) {
    this.pieces[i].setBackground(imageUrl, 1);
    this.pieces[i].swapIndices(this.pieces[_randomIntBetween(0, length)]);
  }
  for (var i = 0; i < this.pieces.length; i++) {
    this.pieces[i].setIndexedPosition();
    this.pieces[i].scaleTweener.set(1, 1, 1, {
      duration: 600 + (600 * i / this.pieces.length),
      curve: 'inOutCirc'
    });
  }

}


// Piece Module

function Piece(xIndex, yIndex, piecesPerRow, boardWidth) {
  Node.call(this);
  
  this.inMotion = false;
  this.hasMoved = false;
  this.hoverActivated = false;
  this.piecesPerRow = piecesPerRow;
  this.boardWidth = boardWidth;
  this.xIndex = xIndex;
  this.yIndex = yIndex;
  this.bgXIndex = xIndex;
  this.bgYIndex = yIndex;
  this.scaleTweener = new Scale(this);
  
  this.el = new DOMElement(this, {
    classes: ['piece'],
    properties: { backgroundSize: 100 * piecesPerRow + '%' }
  });

  this.setProportionalSize(1 / piecesPerRow, 1 / piecesPerRow);
  this.setOrigin(0.5, 0.5);
  this.scaleTweener.set(0, 0, 1);

  this.addUIEvent('mousedown');
  this.addUIEvent('touchstart');
}
Piece.prototype = Object.create(Node.prototype);
Piece.prototype.constructor = Piece;

Piece.prototype.setIndexedPosition = function() {
  var positionX = this.boardWidth * this.xIndex / this.piecesPerRow,
      positionY = this.boardWidth * this.yIndex / this.piecesPerRow;
  
  this.angleIndex = _randomIntBetween(0, 3) / 2;
  this.setRotation(0, 0, this.angleIndex * Math.PI);
  this.setPosition(positionX, positionY);
}

Piece.prototype.setBackground = function(imageUrl, imageRatio) {
  
  // INCLUDE IMAGE RATIO ADJUSTMENTS CALCULATIONS !!!
  
  var bgPositionX = 100 * this.bgXIndex / (this.piecesPerRow - 1) + '%',
      bgPositionY = 100 * this.bgYIndex / (this.piecesPerRow - 1) + '%';

  this.el.setProperty('backgroundPosition', bgPositionX + ' ' + bgPositionY);
  this.el.setProperty('backgroundImage', 'url(' + imageUrl + ')');
}

Piece.prototype.rotate = function () {
  if (!this.inMotion) {
    var node = this,
        rotationTweener = new Rotation(this),
        scaleTweener = this.scaleTweener;
    
    this.inMotion = true;
    this.el.addClass('in-motion');
    this.angleIndex = this.angleIndex > 1 ?
      0 : this.angleIndex + 1/2;
    
    rotationTweener.set(0, 0, Math.PI*this.angleIndex, {
      duration: 200,
      curve: 'easeInOut'
    }, function () {
      node.inMotion = false;
      node.el.removeClass('in-motion');
    });

    scaleTweener.set(1.3, 1.3, 1, {
      duration: 100,
      curve: 'easeIn'
    }, function () {
      scaleTweener.set(1, 1, 1, {
        duration: 100,
        curve: 'easeOut'
      });
    });
  }
}

Piece.prototype.swapIndices = function(otherPiece) {
  var tempXIndex = this.xIndex,
      tempYIndex = this.yIndex;

  if (otherPiece) {
    this.xIndex = otherPiece.xIndex;
    this.yIndex = otherPiece.yIndex;
    otherPiece.xIndex = tempXIndex;
    otherPiece.yIndex = tempYIndex;
  }
}

Piece.prototype.swapAfterDrag = function (swappedNode, nodeWidth) {
  if (!this.inMotion) {
    this.swapIndices(swappedNode);
    this.drop(nodeWidth);
    if (swappedNode) swappedNode.drop(nodeWidth);
  }
}

Piece.prototype.drop = function (nodeWidth) {
  var node = this,
      thisX = this.xIndex * nodeWidth,
      thisY = this.yIndex * nodeWidth,
      thisPositionTweener = new Position(this),
      endScaleDuration = 100,
      moveCurve = 'easeInOut',
      midScale = 1.3;

  if (this.hoverActivated) {
    this.hoverActivated = false;
    this.el.addClass('to-swap');
    midScale = 0.7;
    endScaleDuration = 200;
    moveCurve = 'easeOut';
  }

  this.inMotion = true;

  thisPositionTweener.set(thisX, thisY, 0, {
    duration: 200,
    curve: moveCurve
  });

  this.scaleTweener.set(midScale, midScale, 1, {
    duration: 100,
    curve: 'easeIn'
  }, function () {
    node.scaleTweener.set(1, 1, 1, {
      duration: endScaleDuration,
      curve: 'easeOut'
    }, function () {
      node.el.removeClass('in-motion');
      node.el.removeClass('to-swap');
      node.inMotion = false;
    });
  });
}


// Helper Module

function _centerNode() {
  this.setSizeMode(1, 1);
  this.setAlign(0.5, 0.5);
  this.setMountPoint(0.5, 0.5)
  this.setOrigin(0.5, 0.5);
}

function _randomIntBetween(minInt, maxInt) {
  return Math.floor((Math.random() * (maxInt - minInt + 1)) + minInt);
}


// Main Module

function initAppOn(sceneSelector) {
  FamousEngine.init();
  var puzzleApp,
      puzzleAppScene = FamousEngine.createScene(sceneSelector),
      puzzleAppCamera = new Camera(puzzleAppScene);
  
  puzzleAppCamera.setDepth(1500);

  puzzleAppScene.addComponent({
    onReceive: function (e, payload) {
      if (e === 'CONTEXT_RESIZE' && !puzzleApp) {
        puzzleApp = puzzleAppScene.addChild(new PuzzleApp(payload));
      }
    }.bind(this)
  });
}

initAppOn('.phone .screen');
