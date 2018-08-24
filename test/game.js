const assert = require('assert')
const Game = require('../game.js')

function shouldTurnRight() {
    console.log("Should turn right from position 0")
    let game = new Game()
    let initialPosition = game.playerTrack
    game.turnRight()

    try {
        assert.strictEqual(game.playerTrack, initialPosition + 1)
        console.log("  Ok!")
    } catch (e) {
        console.error(e)
    }
}
shouldTurnRight()

function shouldNotTurnRight() {
    console.log("Should not turn right if on cooldown")
    let game = new Game()
    let initialPosition = game.playerTrack
    game.playerMoveCooldown = 1
    game.turnRight()
    try {
        assert.strictEqual(game.playerTrack, initialPosition)
        console.log("  Ok!")
    } catch (e) {
        console.error(e)
    }
}
shouldNotTurnRight()

function shouldTurnRightLastPosition() {
    console.log("Should turn right from last position")
    let game = new Game()
    game.playerTrack = game.maxTracks - 1
    let initialPosition = game.playerTrack
    game.turnRight()

    try {
        assert.strictEqual(game.playerTrack, 0)
        console.log("  Ok!")
    } catch (e) {
        console.error(e)
    }
}
shouldTurnRightLastPosition()

function shouldTurnLeft() {
    console.log("Should turn left from last position")
    let game = new Game()
    game.playerTrack = game.maxTracks - 1
    let initialPosition = game.playerTrack
    game.turnLeft()

    try {
        assert.strictEqual(game.playerTrack, initialPosition - 1)
        console.log("  Ok!")
    } catch (e) {
        console.error(e)
    }
}
shouldTurnLeft()

function shouldNotTurnLeft() {
    console.log("Should not turn left if on cooldown")
    let game = new Game()
    game.playerTrack = game.maxTracks - 1
    let initialPosition = game.playerTrack
    game.playerMoveCooldown = 1
    game.turnLeft()
    try {
        assert.strictEqual(game.playerTrack, initialPosition)
        console.log("  Ok!")
    } catch (e) {
        console.error(e)
    }
}
shouldNotTurnLeft()

function shouldTurnLeftFirstPosition() {
    console.log("Should turn left from position 0")
    let game = new Game()
    game.playerTrack = 0
    let initialPosition = game.playerTrack
    game.turnLeft()

    try {
        assert.strictEqual(game.playerTrack, game.maxTracks - 1)
        console.log("  Ok!")
    } catch (e) {
        console.error(e)
    }
}
shouldTurnLeftFirstPosition()

function shootOnCooldown() {
    console.log("Should not shoot if on cooldown")
    let game = new Game()
    game.playerShotCooldown = 1
    let numberOfProjectiles = game.projectiles.length
    game.shoot()

    try {
        assert.strictEqual(game.projectiles.length, numberOfProjectiles)
        console.log("  Ok!")
    } catch (e) {
        console.error(e)
    }
}
shootOnCooldown()

function shootNotOnCooldown() {
    console.log("Should not shoot if on cooldown")
    let game = new Game()
    game.playerShotCooldown = 0
    let numberOfProjectiles = game.projectiles.length
    game.shoot()

    try {
        assert.strictEqual(game.projectiles.length, numberOfProjectiles + 1)
        console.log("  Ok!")
    } catch (e) {
        console.error(e)
    }
}
shootNotOnCooldown()

function ShouldSpawnEnemy() {
    console.log("Should spawn an enemy")
    let game = new Game()
    let numberOfEnemies = game.enemies.length
    game.spawnEnemy(1, 0.01)

    try {
        assert.strictEqual(game.enemies.length, numberOfEnemies + 1)
        assert.strictEqual(game.enemies[0].speed, 0.01)
        assert.strictEqual(game.enemies[0].track, 1)
        console.log("  Ok!")
    } catch (e) {
        console.error(e)
    }
}
ShouldSpawnEnemy()

function gameTickTests() {
    console.log("Testing the game tick logic")

    function shouldIncrementTick() {
        console.log("  Should increment game tick")
        let game = new Game()
        let currentTick = game.tick
        game._gameTick()
        try {
            assert.strictEqual(game.tick, currentTick + 1)
            console.log("    Ok!")
        } catch (e) {
            console.error(e)
        }
    }
    shouldIncrementTick()

    function shouldMoveProjectiles() {
        console.log("  Should change projectile positions")
        let game = new Game()
        game.shoot()
        let projectilePosition = game.projectiles[0].position
        game._gameTick()
        try {
            let currentPosition = game.projectiles[0].position

            assert.strictEqual(currentPosition, projectilePosition + game.projectileSpeed)
            console.log('    Ok!')
        } catch (e) {
            console.error(e)
        }
    }
    shouldMoveProjectiles()

    function shouldRemoveOutOfBoundsProjectile() {
        console.log("  Should remove the out of bounds projectile from the array")
        let game = new Game()
        game.shoot()
        game.projectiles[0].position = 1
        game._gameTick()
        try {
            assert.strictEqual(game.projectiles.length, 0)
            console.log('    Ok!')
        } catch (e) {
            console.error(e)
        }
    }
    shouldRemoveOutOfBoundsProjectile()

    function shouldMoveEnemies() {
        console.log("  Should move the enemy")
        let game = new Game()
        game.spawnEnemy(0, 0.03)
        let oldEnemyPosition = game.enemies[0].position
        game._gameTick()
        try {
            assert.strictEqual(game.enemies[0].position, oldEnemyPosition - game.enemies[0].speed)
            console.log('    Ok!')
        } catch (e) {
            console.error(e)
        }
    }
    shouldMoveEnemies()


    function shouldRemoveEnemiesThatHitThePlayer() {
        console.log("  Should remove the enemies that hit the player from the enemies array")
        let game = new Game()
        game.spawnEnemy(0, 10)
        let oldEnemiesLength = game.enemies.length
        let oldPlayerLife   = game.playerLives
        game._gameTick()
        try {
            assert.strictEqual(game.enemies.length, oldEnemiesLength - 1)
            assert.strictEqual(game.playerLives, oldPlayerLife - 1)
            console.log('    Ok!')
        } catch (e) {
            console.error(e)
        }
    }
    shouldRemoveEnemiesThatHitThePlayer()

    function shouldRemoveEnemiesAndProjectilesOnHit() {
        console.log("  Should remove enemies and projectiles when hit, also increment player score")
        let game = new Game()
        game.enemies = [{ position: 0.5, speed: 0.01, track: 0, id: 'enemy1' }]
        game.projectiles = [{ position: 0.45, speed: 0.5, track: 0, id: 'proj1' }]
        let previousScore = game.score
        game._gameTick()
        try {
            assert.strictEqual(game.enemies.length, 0)
            assert.strictEqual(game.projectiles.length, 0)
            assert.strictEqual(game.score, previousScore + 1)
            console.log("     Ok!")
        } catch(e) {
            console.error(e)
        }
    }
    shouldRemoveEnemiesAndProjectilesOnHit()

}
gameTickTests()
