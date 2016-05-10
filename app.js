/**  Unsplashed - FamousJS Image Puzzle Concept Game (Work In Progress)
 *   Author: Farias Maiquita http://codepen.io/fariasmaiquita/
 *   License: GNU GPLv3
 */

'use strict';

// Famous dependencies

var FamousEngine = famous.core.FamousEngine,
    Node = famous.core.Node,
    Position = famous.components.Position,
    Rotation = famous.components.Rotation,
    Scale = famous.components.Scale,
    DOMElement = famous.domRenderables.DOMElement;


// Puzzle App Module

function PuzzleApp(contextSize) {
  Node.call(this);
  this.el = new DOMElement(this, { classes: ['puzzle-app'] });
  
  // Menu Elements
  this.menu = this.addChild(new Menu());
  this.winStatsNode = this.menu.plaques[5].columns[1].rows[1].content;
  this.lossStatsNode = this.menu.plaques[5].columns[2].rows[1].content;
  this.resumePuzzleBtn = this.menu.plaques[6].buttons[0];
  this.newPuzzleBtn = this.menu.plaques[6].buttons[1];
  
  // Puzzle Elements
  this.puzzle = this.addChild(new Puzzle());
  this.backBtn = this.puzzle.plaques[1].buttons[0];
  this.snapBtn = this.puzzle.plaques[1].buttons[1];
  this.movesCounter = this.puzzle.plaques[3].columns[1].content;

  // Testing Some Event Listeners
  this.winStatsNode.addComponent({
    onMount: function(node) {
      node.setContent({ text: '1 (33.3%)' });
    }
  });
  this.lossStatsNode.addComponent({
    onMount: function(node) {
      node.setContent({ text: '2 (66.7%)' });
    }
  });
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
      if (e === 'click') {
        console.log('new puzzle button clicked!!');
      }
    }
  });

  this.roundData = {
    counter: 1,
    piecesPerRow: 4//_randomIntBetween(2, 4)
  };
  
  //this.board = this.addChild(new Board(this.roundData.piecesPerRow));
  this.boardMaxWidth = 1080;
  this.resizeChildren(contextSize);
  //_bindPuzzleAppEvents.call(this);
}

PuzzleApp.prototype = Object.create(Node.prototype);


function Puzzle() {
  Node.call(this);
  this.el = new DOMElement(this, { classes: ['puzzle', 'view'] });
  this.plaques = [
    this.addChild(new Plaque(1/16, null)),
    this.addChild(new Plaque(2.5/16, { buttons: [
      { text: 'Back to Menu', width: 17/40 },
      { text: 'Snap!', class: 'inactive', width: 8/40 }
    ]})),
    this.addChild(new Plaque(9/16, null)),
    this.addChild(new Plaque(2.5/16, [
      { text: 'Moves<br>Remaining', class: 'align-right', width: 1/2 },
      { text: '&mdash;', class: 'heading indented', width: 1/2 }
    ])),
    this.addChild(new Plaque(1/16, null))
  ];
}
Puzzle.prototype = Object.create(Node.prototype);

function Menu() {
  Node.call(this);
  this.el = new DOMElement(this, { classes: ['menu', 'view', 'hidden'] });
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
    this.addChild(new Plaque(1/8, {
      main: [
        { icon: 'pie-chart', width: 2/9 },
        { rows: [{ text: 'Win Stats' }, { text: '&mdash;' }], width: 3.3/9 },
        { rows: [{ text: 'Loss Stats' }, { text: '&mdash;' }], width: 3.3/9 }
      ],
      onflip: { text: 'Paused puzzle will be discarded and<br>counted as a loss. Continue?' }
    })),
    this.addChild(new Plaque(1/8, {
      main: { buttons: [
        { text: 'Resume Puzzle', width: 17/40 },
        { text: 'New Puzzle', width: 17/40 }
      ]},
      onflip: { buttons: [
        { text: 'Yes', width: 17/40 },
        { text: 'No', width: 17/40 }
      ]}
    })),
    this.addChild(new Plaque(1/8, { icon: 'crop' }))
  ];
}
Menu.prototype = Object.create(Node.prototype);

function Plaque(height, contents) {
  Node.call(this);
  this.el = new DOMElement(this, { classes: ['plaque', 'relative'] });
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


PuzzleApp.prototype.resizeChildren = function (contextSize)  {
  var boardWidth = contextSize[0];
  boardWidth = boardWidth > this.boardMaxWidth ?
    this.boardMaxWidth : boardWidth;
  //this.board.resizeChildren(boardWidth);
}

function _bindPuzzleAppEvents() {
  var rootNode = this,
      pieces = []; //this.board.pieces;

  this.addUIEvent('mousemove');
  this.addUIEvent('touchmove');
  this.addUIEvent('mouseup');
  this.addUIEvent('touchend');

  this.addComponent({
    onReceive: function (e, payload) {

      if ((e === 'mouseup') /*&& (payload.node.key === 'resumePuzzleBtn')*/) {
        console.log('a button was clicked');
      }

      if ((e === 'mousedown' || e === 'touchstart') && (payload.node.constructor === Piece)) {
        var toMoveNode = payload.node,
            initX = (e === 'touchstart') ? payload.touches[0].clientX : payload.clientX,
            initY = (e === 'touchstart') ? payload.touches[0].clientY : payload.clientY;

        rootNode.childToMove = {
          node: toMoveNode,
          nodeWidth: rootNode.board.getAbsoluteSize()[0] / rootNode.board.piecesPerRow,
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
            startingX = movingNode.indexData.xIndex * nodeWidth,
            startingY = movingNode.indexData.yIndex * nodeWidth,
            pieces = rootNode.board.pieces;
          
        movingNode.hasMoved = true;
        movingNode.setPosition(moveX, moveY);

        rootNode.childToMove.swapingNode = null;
        for (var i = 0; i < pieces.length; i++) {
          var minX = pieces[i].indexData.xIndex * nodeWidth - nodeWidth/2,
              maxX = minX + nodeWidth,
              minY = pieces[i].indexData.yIndex * nodeWidth  - nodeWidth/2,
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

function Board(piecesPerRow) {
  Node.call(this);
  _centerNode.call(this);
  
  this.piecesPerRow = piecesPerRow;
  this.el = new DOMElement(this, {tagName: 'board'});
  

  this.setupRound(piecesPerRow);
}

Board.prototype = Object.create(Node.prototype);

Board.prototype.resizeChildren = function (boardWidth) {
  this.setAbsoluteSize(boardWidth, boardWidth);
  for (var i = 0; i < this.pieces.length; i++) {
    this.pieces[i].repositionNode(boardWidth);
  }
}

Board.prototype.setupRound = function (piecesPerRow) {
  var imageUrl = 'image_rectangular.jpg';

  this.piecesPerRow = piecesPerRow;
  this.pieces = [];
  
  for (var y = 0; y < piecesPerRow; y++) {
    for (var x = 0; x < piecesPerRow; x++) {
      this.pieces.push(this.addChild(new Piece(imageUrl, {
        xIndex: x,
        yIndex: y,
        maxXYIndex: piecesPerRow - 1,
        angleIndex: _randomIntBetween(0, 3) / 2
      })));
    }
  }
}


// Piece Module

function Piece(imageUrl, indexData) {
  Node.call(this);
  
  this.proportion = 1 / (indexData.maxXYIndex + 1);
  this.setProportionalSize(this.proportion, this.proportion);
  this.setOrigin(0.5, 0.5);
  this.setRotation(0, 0, Math.PI * indexData.angleIndex);
  
  this.inMotion = false;
  this.hasMoved = false;
  this.hoverActivated = false;
  this.indexData = indexData;
  
  this.el = new DOMElement(this, {
    tagName: 'piece',
    properties: {
      backgroundImage: 'url(' + imageUrl + ')',
      backgroundSize: 100 / this.proportion + '%'
    }
  });
  this.setImagePosition(indexData);
  
  this.scaleTweener = new Scale(this);
  
  this.addUIEvent('mousedown');
  this.addUIEvent('touchstart');
}

Piece.prototype = Object.create(Node.prototype);
Piece.prototype.constructor = Piece;

Piece.prototype.setImagePosition = function (indexData) {
  var positionX = 100 * indexData.xIndex / indexData.maxXYIndex + '%',
      positionY = 100 * indexData.yIndex / indexData.maxXYIndex + '%';
  
  this.el.setProperty('backgroundPosition', positionX + ' ' + positionY);
}

Piece.prototype.repositionNode = function (boardWidth) {
  var xPosition = boardWidth * this.proportion * this.indexData.xIndex,
      yPosition = boardWidth * this.proportion * this.indexData.yIndex;
  
  this.setPosition(xPosition, yPosition);
}

Piece.prototype.rotate = function () {
  if (!this.inMotion) {
    var node = this,
        rotationTweener = new Rotation(this),
        scaleTweener = this.scaleTweener;
    
    this.inMotion = true;
    this.el.addClass('in-motion');
    this.indexData.angleIndex = this.indexData.angleIndex > 1 ?
      0 : this.indexData.angleIndex + 1/2;
    
    rotationTweener.set(0, 0, Math.PI*this.indexData.angleIndex, {
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

Piece.prototype.swapAfterDrag = function (swappedNode, nodeWidth) {
  if (!this.inMotion) {
    var tempXIndex = this.indexData.xIndex,
        tempYIndex = this.indexData.yIndex;

    if (swappedNode) {
      this.indexData.xIndex = swappedNode.indexData.xIndex;
      this.indexData.yIndex = swappedNode.indexData.yIndex;
      swappedNode.indexData.xIndex = tempXIndex;
      swappedNode.indexData.yIndex = tempYIndex;
    }
    
    this.drop(nodeWidth);
    if (swappedNode) swappedNode.drop(nodeWidth);
  }
}

Piece.prototype.drop = function (nodeWidth) {
  var node = this,
      thisX = this.indexData.xIndex * nodeWidth,
      thisY = this.indexData.yIndex * nodeWidth,
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
      puzzleAppScene = FamousEngine.createScene(sceneSelector);
  puzzleAppScene.addComponent({
    onReceive: function (e, payload) {
      if (e === 'CONTEXT_RESIZE') {
        if (puzzleApp) {
          puzzleApp.resizeChildren(payload);
        } else {
          puzzleApp = puzzleAppScene.addChild(new PuzzleApp(payload));
        }
      }
    }.bind(this)
  });
}

initAppOn('.phone .screen');
