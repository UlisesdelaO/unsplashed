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
  this.contextSize = contextSize;
  
  var rootNode = this;

  // Menu and its Button Elements
  this.menu = this.addChild(new Menu());
  this.resumePuzzleBtn = this.menu.plaques[6].buttons[0];
  this.newPuzzleBtn = this.menu.plaques[6].buttons[1];
  
  // Puzzle and its Button Elements
  this.puzzle = this.addChild(new Puzzle(contextSize[0]));
  this.backBtn = this.puzzle.plaques[1].buttons[0];
  this.nextBtn = this.puzzle.plaques[1].buttons[1];

  this.currentView = this.menu;

  _bindPuzzleAppEvents.call(this);
}

PuzzleApp.prototype = Object.create(Node.prototype);

PuzzleApp.prototype.newGame = function() {
  var rootNode = this;

  var setupForNewImage = function() {
    rootNode.puzzle.board.newImage(function() {
      rootNode.nextBtn.setEnabledTo(true);
    });
    rootNode.resumePuzzleBtn.setEnabledTo(true);
  };

  this.nextBtn.setEnabledTo(false);
  this.puzzle.setMovesCounterTo(this.puzzle.maxMovesCounter);
  this.puzzle.correctPieces = 0;
  this.puzzle.board.gameOverSign.scaleTweener.set(0, 0, 1);

  for (var i = 0; i < this.puzzle.board.pieces.length; i++) {
    this.puzzle.board.pieces[i].scaleTweener.set(0, 0, 1);
  }

  if (this.currentView.constructor === Menu) {
    this.menu.transitionTo(this.puzzle, function() {
      rootNode.currentView = rootNode.puzzle;
      setupForNewImage();
    });
  } else {
    setupForNewImage();
  }
}

function _bindPuzzleAppEvents() {
  var rootNode = this,
      pieces = [];

  this.addUIEvent('mousemove');
  this.addUIEvent('touchmove');
  this.addUIEvent('mouseup');
  this.addUIEvent('touchend');

  this.resumePuzzleBtn.addComponent({
    onMount: function(node) {
      node.setEnabledTo(false);
      node.addUIEvent('click');
    },
    onReceive: function(e, payload) {
      if (e === 'click' && payload.node.enabled) {
        rootNode.menu.transitionTo(rootNode.puzzle, function() {
          rootNode.currentView = rootNode.puzzle;
        });
      }
    }
  });
  this.newPuzzleBtn.addComponent({
    onMount: function(node) { node.addUIEvent('click'); },
    onReceive: function(e, payload) {
      if (e === 'click') { rootNode.newGame(); }
    }
  });
  this.backBtn.addComponent({
    onMount: function(node) { node.addUIEvent('click'); },
    onReceive: function(e, payload) {
      if (e === 'click') {
        rootNode.puzzle.transitionTo(rootNode.menu, function() {
          rootNode.currentView = rootNode.menu;
        });
      }
    }
  });
  this.nextBtn.addComponent({
    onMount: function(node) { node.addUIEvent('click'); },
    onReceive: function(e, payload) {
      if (e === 'click' && payload.node.enabled) {
        rootNode.newGame();
      }
    }
  });

  // Listen and Handle Tap / Drag Gestures
  this.addComponent({
    onReceive: function (e, payload) {

      // Initiate Tap / Drag Gesture
      if ((e === 'mousedown' || e === 'touchstart') &&
          (payload.node.constructor === Piece) &&
          !payload.node.isCorrect &&
          rootNode.puzzle.movesCounter > 0) {

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

      // Handle Positioning on Mouse / Touch Move Gesture
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
            if (!pieces[i].hoverActivated && !pieces[i].isCorrect) {
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

      // Terminate Tap / Drag Gesture
      if ((e === 'mouseup' || e === 'touchend')) {
        if (rootNode.childToMove) {
          if (rootNode.childToMove.node.hasMoved) {
            var movedNode = rootNode.childToMove.node,
                swappedNode = rootNode.childToMove.swapingNode,
                nodeWidth = rootNode.childToMove.nodeWidth;

            swappedNode = (swappedNode && swappedNode.isCorrect) ? null : swappedNode;
            movedNode.swapAfterDrag(swappedNode, nodeWidth);
            if (swappedNode) {
              rootNode.puzzle.trackProgress([movedNode, swappedNode]);
            }

          } else {
            rootNode.childToMove.node.rotate();
            rootNode.puzzle.trackProgress([rootNode.childToMove.node]);
          }
          rootNode.childToMove.node.hasMoved = false;
          rootNode.childToMove = null;
        }
      }
    }.bind(this)
  });
}


// View Module

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


// Menu View Module

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
Menu.prototype.constructor = Menu;


// Puzzle View Module

function Puzzle(contextWidth) {
  View.call(this);
  
  this.piecesPerRow = 3;
  this.maxMovesCounter = this.piecesPerRow * this.piecesPerRow * 4;
  this.movesCounter = this.maxMovesCounter;
  this.correctPieces = 0;

  this.el.addClass('puzzle').addClass('hidden');
  this.plaques = [
    this.addChild(new Plaque(1/16, null)),
    this.addChild(new Plaque(2.5/16, { buttons: [
      { text: '&laquo; Back to Menu', width: 15/40 },
      { text: 'Next &raquo;', width: 8/40 }
    ]})),
    this.addChild(new Plaque(9/16, { node: new Board(this.piecesPerRow, contextWidth) })),
    this.addChild(new Plaque(2.5/16, [
      { text: 'Moves<br>Remaining', class: 'align-right', width: 1/2 },
      { text: this.maxMovesCounter, class: 'heading indented', width: 1/2 }
    ])),
    this.addChild(new Plaque(1/16, null))
  ];

  this.board = this.plaques[2].child;
  this.movesCounterNode = this.plaques[3].columns[1].content;
  this.plaques[2].el.setProperty('zIndex', 2);
}

Puzzle.prototype = Object.create(View.prototype);
Puzzle.prototype.constructor = Puzzle;

Puzzle.prototype.setMovesCounterTo = function (number) {
  if (number <= this.maxMovesCounter) {
    this.movesCounter = number;
    this.movesCounterNode.setContent({ text: number.toString(), class: 'heading indented' });
  }
}

Puzzle.prototype.decrementMovesCounter = function() {
  if (this.movesCounter > 0) {
    this.setMovesCounterTo(this.movesCounter - 1);
  }
}

Puzzle.prototype.trackProgress = function(pieces) {
  this.decrementMovesCounter();
  for (var i = 0; i < pieces.length; i++) {
    if (pieces[i].bgXIndex == pieces[i].xIndex &&
        pieces[i].bgYIndex == pieces[i].yIndex &&
        pieces[i].angleIndex == 0) {

      this.correctPieces++;
      pieces[i].isCorrect = true;
      pieces[i].el.addClass('correct');
    }
  }
  if (this.correctPieces == this.piecesPerRow * this.piecesPerRow) {
    this.board.showGameOverSign({ win: true });
  } else if (this.movesCounter == 0) {
    this.board.showGameOverSign({ win: false });
  }
}


// Plaque Module

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
          column.content = column.addChild(new Content(contentSet[i]));
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


// Content Module

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


// Button Module

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

Button.prototype.setEnabledTo = function(bool) {
  this.enabled = bool;
  if (bool) { this.el.removeClass('inactive'); }
  else { this.el.addClass('inactive'); }
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

  this.gameOverSign = this.addChild();
  this.gameOverSign.el = new DOMElement(this.gameOverSign, {
    classes: ['game-over-sign'],
    content: '<div class="children-centered"><svg class="lnr lnr-thumbs-up"><use xlink:href="#lnr-thumbs-up"></use></svg></div>'
  });
  this.gameOverSign.setProportionalSize(1/6, 1/6);
  this.gameOverSign.setAlign(0.5, 5/6);
  this.gameOverSign.setMountPoint(0.5, 0.5)
  this.gameOverSign.setOrigin(0.5, 0.5);
  this.gameOverSign.scaleTweener = new Scale(this.gameOverSign);
  this.gameOverSign.scaleTweener.set(0, 0, 1);
}

Board.prototype = Object.create(Node.prototype);

Board.prototype.newImage = function(onCompleteFn) {
  var board = this,
      imageUrl = 'https://source.unsplash.com/random/?=' + (new Date().getTime()),
      //imageUrl = 'image_rectangular_portrait.jpg',
      //imageUrl = 'image_rectangular_landscape.jpg',
      image = new Image();

  board.el.addClass('loading');
  image.src = imageUrl;
  image.onload = function() {
    Clock.setTimeout(function() {
      board.el.removeClass('loading');
      board.setupPuzzle(image, onCompleteFn);
    }, 300);
  }
  image.onerror = function() {
    // Not tested!!!
    board.newImage(onCompleteFn);
  }
}

Board.prototype.setupPuzzle = function(image, onCompleteFn) {
  for (var i = 0, length = this.pieces.length; i < length; i++) {
    this.pieces[i].setBackground(image);
    this.pieces[i].isCorrect = false;
    this.pieces[i].el.removeClass('correct');
    this.pieces[i].swapIndices(this.pieces[_randomIntBetween(0, length)]);
  }
  for (var i = 0, length = this.pieces.length; i < length; i++) {
    var currentIndex =i;
    this.pieces[i].setIndexedPosition();
    this.pieces[i].scaleTweener.set(1, 1, 1, {
      duration: 600 + (600 * i / length),
      curve: 'inOutCirc'
    }, function() {
      if (currentIndex == length -1) {
        try { onCompleteFn(); } catch(e) {}
      }
    });
  }

}

Board.prototype.showGameOverSign = function(gameOverState) {
  if (gameOverState.win) {
    this.gameOverSign.el.removeClass('lost');
  } else {
    this.gameOverSign.el.addClass('lost');
  }
  this.gameOverSign.scaleTweener.set(1, 1, 1, {
    duration: 600,
    curve: 'outBack'
  });
}


// Piece Module

function Piece(xIndex, yIndex, piecesPerRow, boardWidth) {
  Node.call(this);
  
  this.isCorrect = false;
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
  
  this.el = new DOMElement(this, { classes: ['piece'] });

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
  
  this.angleIndex = _randomIntBetween(1, 3) / 2;
  this.setRotation(0, 0, this.angleIndex * Math.PI);
  this.setPosition(positionX, positionY);
}

Piece.prototype.setBackground = function(image) {
  var iw = image.width,
      ih = image.height,
      bw = this.boardWidth,
      pw = bw / this.piecesPerRow,
      xPercent = this.bgXIndex / (this.piecesPerRow - 1),
      yPercent = this.bgYIndex / (this.piecesPerRow - 1),
      ratio = 1,
      bgPositionX, bgPositionY;

  if (iw > ih) {
    ratio = iw / ih;
    bgPositionX = ((ih - iw) * bw * ratio - 2 * (ih * bw * ratio - iw * pw) * xPercent) / (2 * iw) + 'px';
    bgPositionY = yPercent * 100 + '%';
  } else if (iw < ih) {
    var r = ih / iw;
    bgPositionY = ((iw - ih) * bw * r - 2 * (iw * bw * r - ih * pw) * yPercent) / (2 * ih) + 'px';
    bgPositionX = xPercent * 100 + '%';
  } else {
    bgPositionX = xPercent * 100 + '%';
    bgPositionY = yPercent * 100 + '%';
  }

  this.el.setProperty('backgroundSize', 100 * ratio * this.piecesPerRow + '%');
  this.el.setProperty('backgroundPosition', bgPositionX + ' ' + bgPositionY);
  this.el.setProperty('backgroundImage', 'url(' + image.src + ')');
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
      //try { onCompleteFn(); } catch(e) {}
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
      //try { onCompleteFn(); } catch(e) {}
    });
  });
}

//Piece.prototype.


// Helper Functions

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
