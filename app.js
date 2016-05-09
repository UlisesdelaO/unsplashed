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
    //Size = famous.components.Size,
    //GestureHandler = famous.components.GestureHandler,
    DOMElement = famous.domRenderables.DOMElement;


// Puzzle App Module

function PuzzleApp(contextSize) {
  Node.call(this);
  this.el = new DOMElement(this, { classes: ['puzzle-app'] });
  
  this.menu = this.addChild(new Menu());

  /*this.views = {
    home: this.addChild(new ViewItem(this, this.getHomeViewTree())),
    puzzle: {}
  };*/
  
  // To be moved to the bind puzzle app events, probably
  /*var rootNode = this;
  this.views.home.addComponent({
    onMount: function(node) {
      rootNode.resumePuzzleBtn.addComponent({
        onMount: function(node) {
          node.el.addClass('inactive');
          node.addUIEvent('click');
        },
        onReceive: function(e, payload) {
          console.log('"Resume Puzzle" button was clicked');
        }
      });
      rootNode.newPuzzleBtn.addComponent({
        onMount: function(node) {
          node.addUIEvent('click');
        },
        onReceive: function(e, payload) {
          console.log('"New Puzzle" button was clicked');
        }
      });
    }
  });*/

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

function Menu() {
  Node.call(this);
  this.el = new DOMElement(this, { classes: ['menu', 'view'] });
  this.plaques = [
    this.addChild(new Plaque(1/8, { icon: 'crop' })),
    this.addChild(new Plaque(1/8, { text: 'Unsplashed', class: 'logo' })),
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
        { rows: [{ text: 'Win Stats' }, { tex: '&mdash;', key: 'winStatsNode' }], width: 3.3/9 },
        { rows: [{ text: 'Loss Stats' }, { tex: '&mdash;', key: 'lossStatsNode' }], width: 3.3/9 }
      ],
      onflip: { text: 'Paused puzzle will be discarded and counted as a loss. Continue?' }
    })),
    this.addChild(new Plaque(1/8, {
      main: { buttons: [
        { text: 'Resume Puzzle', key: 'resumePuzzleBtn', width: 17/40 },
        { text: 'New Puzzle', key: 'newPuzzleBtn', width: 17/40 },
      ]},
      onflip: { buttons: [
        { text: 'Yes', key: 'lossConfirmYesBtn', width: 17/40 },
        { text: 'No', key: 'lossConfirmNoBtn', width: 17/40 },
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
  
  var mainContents = contents.main ? contents.main : contents,
      onflipContents = contents.onflip;

  var setupElements = function (contentSet, container) {
    if (contentSet.constructor === Array) {
      container.el.addClass('children-float');
      for (var i = 0; i < contentSet.length; i++) {
        var column = container.addChild(),
            width = contentSet[i].width || 1;
        column.el = new DOMElement(column, { classes: ['column', 'relative'] });
        column.setProportionalSize(width, 1);
        if (contentSet[i].rows) {
          for (var j = 0; j < contentSet[i].rows.length; j++) {
            var row = column.addChild();
            row.el = new DOMElement(row, { classes: ['relative'] });
            row.setProportionalSize(1, 1/contentSet[i].rows.length);
            row.addChild(new Content(contentSet[i].rows[j]));
          }
        } else {
          column.addChild(new Content(contentSet[i]));
        }
      }
    } else if (contentSet.buttons) {
      container.el.addClass('children-centered');
      for (var i = 0; i < contentSet.buttons.length; i++) {
        container.addChild(new Button(contentSet.buttons[i]));
      }
    } else {
      container.addChild(new Content(contentSet));
    }
  };

  setupElements(mainContents, this);

  if (onflipContents) {
    this.onflipContainer = this.addChild();
    this.onflipContainer.el = new DOMElement(this, { classes: ['on-flip'] });
    setupElements(onflipContents, this.onflipContainer);
  }
}
Plaque.prototype = Object.create(Node.prototype);

function Content(details) {
  Node.call(this);
  this.el = new DOMElement(this, { classes: ['relative', 'children-centered'] });
  if (details.icon) {
    this.el.setContent('<div class="children-centered"><!-- svg markup --></div>');
  } else if (details.text) {
    this.el.setContent('<div class="children-centered"><span>' + details.text + '</span></div>');
  }
}
Content.prototype = Object.create(Node.prototype);

function Button(details) {
  Node.call(this);
  this.el = new DOMElement(this, {
    tagName: 'button',
    attributes: { style: 'display:inline-block' },
    content: '<span>' + details.text + '</span>'
  });
  this.setSizeMode('relative', 'render');
  this.setProportionalSize(details.width, 1);
}
Button.prototype = Object.create(Node.prototype);



PuzzleApp.prototype.getHomeViewTree = function () {
  return {
    options: { attributes: { class: 'home view' } },
    children: [
      {
        options: {
          attributes: { class: 'view-row header' },
          content: '<div class="children-centered"><svg class="lnr lnr-crop"><use xlink:href="#lnr-crop"></use></svg></div>'
        },
        height: 1/8
      },
      {
        options: {
          attributes: { class: 'view-row' },
          content: '<div class="children-centered"><div class="logo">Unsplashed</div></div>'
        },
        height: 1/8
      },
      {
        options: { attributes: { class: 'view-row children-float' } },
        height: 1/8,
        children: [
          {
            options: {
              attributes: { class: 'column icon' },
              content: '<div class="children-centered"><svg class="lnr lnr-redo"><use xlink:href="#lnr-redo"></use></svg></div>'
            },
            width: 2/9
          },
          {
            options: {
              attributes: { class: 'column text' },
              content: '<div class="children-centered"><span>Tap pieces to rotate them 90 degrees clockwise</span></div>'
            },
            width: 6.6/9
          }
        ]
      },
      {
        options: { attributes: { class: 'view-row children-float' } },
        height: 1/8,
        children: [
          {
            options: {
              attributes: { class: 'column icon' },
              content: '<div class="children-centered"><svg class="lnr lnr-move"><use xlink:href="#lnr-move"></use></svg></div>'
            },
            width: 2/9
          },
          {
            options: {
              attributes: { class: 'column text' },
              content: '<div class="children-centered"><span>Drag and drop pieces to swap their positions</span></div>'
            },
            width: 6.6/9
          }
        ]
      },
      {
        options: { attributes: { class: 'view-row children-float' } },
        height: 1/8,
        children: [
          {
            options: {
              attributes: { class: 'column icon' },
              content: '<div class="children-centered"><svg class="lnr lnr-hourglass"><use xlink:href="#lnr-hourglass"></use></svg></div>'
            },
            width: 2/9
          },
          {
            options: {
              attributes: { class: 'column text' },
              content: '<div class="children-centered"><span>Beware of the moves counter, moves are not unlimited</span></div>'
            },
            width: 6.6/9
          }
        ]
      },
      {
        options: { attributes: { class: 'view-row children-float' } },
        height: 1/8,
        children: [
          {
            options: {
              attributes: { class: 'column icon' },
              content: '<div class="children-centered"><svg class="lnr lnr-pie-chart"><use xlink:href="#lnr-pie-chart"></use></svg></div>'
            },
            width: 2/9
          },
          {
            options: { attributes: { class: 'column text' } },
            width: 3.3/9,
            children: [
              {
                options: {
                  attributes: { class: 'row-header' },
                  content: '<div class="title">Win Stats<span></div>'
                },
                height: 1/2
              },
              {
                options: {
                  attributes: { class: 'row-main' },
                  content: '&mdash;'
                },
                height: 1/2,
                key: 'winStatsNode'
              }
            ]
          },
          {
            options: { attributes: { class: 'column text' } },
            width: 3.3/9,
            children: [
              {
                options: {
                  attributes: { class: 'row-header' },
                  content: '<div class="title">Loss Stats</div>'
                },
                height: 1/2
              },
              {
                options: {
                  attributes: { class: 'row-main' },
                  content: '&mdash;'
                },
                height: 1/2,
                key: 'lossStatsNode'
              }
            ]
          }
        ]
      },
      {
        options: { attributes: { class: 'view-row children-centered' } },
        height: 1/8,
        children: [
          {
            options: {
              tagName: 'button',
              attributes: { class: 'resume-puzzle', style: 'display:inline-block' },
              content: '<span>Resume Puzzle</span>'
            },
            width: 17/40,
            height: 1/2,
            key: 'resumePuzzleBtn'
          },
          {
            options: {
              tagName: 'button',
              attributes: { class: 'new-puzzle', style: 'display:inline-block' },
              content: '<span>New Puzzle</span>'
            },
            width: 17/40,
            height: 1/2,
            key: 'newPuzzleBtn'
          }
        ]
      },
      {
        options: {
          attributes: { class: 'view-row footer' },
          content: '<div class="children-centered"><svg class="lnr lnr-crop"><use xlink:href="#lnr-crop"></use></svg></div>'
        },
        height: 1/8
      }
    ]
  };
}

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


// ViewIteme Module

function ViewItem(rootNode, tree) {
  Node.call(this);
  var width = tree.width || 1,
      height = tree.height || 1;
  if (tree.options.tagName == 'button') {
    this.setSizeMode('relative', 'render');
    this.setProportionalSize(width, height);
  } else {
    this.setProportionalSize(width, height);
  }
  this.el = new DOMElement(this, tree.options);
  if (tree.key) {
    this.key = tree.key;
    rootNode[tree.key] = this;
  }
  /*if (tree.uiEvents) {
    for (var i = 0; i < tree.uiEvents.length; i++) {
      this.addUIEvent(tree.uiEvents[i]);
    }
  }*/
  if (tree.children) {
    this.children = [];
    for (var i = 0; i < tree.children.length; i++) {
      this.children[i] = this.addChild(new ViewItem(rootNode, tree.children[i]));
    }
  }
}

ViewItem.prototype = Object.create(Node.prototype);


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
