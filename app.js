/**  Unsplashed - FamousJS Image Puzzle Concept Game (Work In Progress)
 *   Author: Farias Maiquita http://codepen.io/fariasmaiquita/
 *   License: GNU GENERAL PUBLIC LICENSE Version 3
 */

'use strict';

// Famous dependencies

var FamousEngine = famous.core.FamousEngine,
    Node = famous.core.Node,
    Position = famous.components.Position,
    Rotation = famous.components.Rotation,
    Scale = famous.components.Scale,
    GestureHandler = famous.components.GestureHandler,
    DOMElement = famous.domRenderables.DOMElement;


// Puzzle App Module

function PuzzleApp(contextSize) {
    Node.call(this);
    this.el = new DOMElement(this, {tagName: 'puzzle-app'});
    
    this.roundData = {
        counter: 1,
        piecesPerRow: 4//_randomIntBetween(2, 4)
    };
    
    this.board = this.addChild(new Board(this.roundData.piecesPerRow));
    this.boardMaxWidth = 1080;
    this.resizeChildren(contextSize);

    _bindPuzzleAppEvents.call(this);
}

PuzzleApp.prototype = Object.create(Node.prototype);

PuzzleApp.prototype.resizeChildren = function (contextSize)  {
    var boardWidth = contextSize[0];
    boardWidth = boardWidth > this.boardMaxWidth ?
        this.boardMaxWidth : boardWidth;
    this.board.resizeChildren(boardWidth);
}

function _bindPuzzleAppEvents() {
    var rootNode = this,
        pieces = this.board.pieces;

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
    var imageUrl = 'image.jpg';

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
