const TICKS_PER_SECOND = 50
const secondsToTicks = seconds => Math.round(seconds * TICKS_PER_SECOND)

class Game {
    constructor(tracks = 8, shotInterval = 0.3, maxLives = 3) {
        this.maxTracks = tracks
        this.maxLives = maxLives
        this.intervalBetweenShots = shotInterval
        this.intervalBetweenPlayerMovement = 0.1
        this.projectileSpeed = 1.6 / TICKS_PER_SECOND

        this.playerLives = maxLives
        this.playerTrack = 0
        this.playerShotCooldown = 0
        this.playerMoveCooldown = 0
        this.projectiles = []
        this.enemies = []
        this.tick = 0
        this.score = 0

        this.turnRight = this.turnRight.bind(this)
        this.turnLeft = this.turnLeft.bind(this)
        this.shoot = this.shoot.bind(this)
        this.getState = this.getState.bind(this)
    }

    getState() {
        return {
            // parameters
            maxTracks: this.maxTracks,
            maxLives: this.maxLives,
            intervalBetweenShots: this.intervalBetweenShots,
            projectileSpeed: this.projectileSpeed,

            // game state
            playerLives: this.playerLives,
            playerTrack: this.playerTrack, // which track the player is looking at
            playerShotCooldown: this.playerShotCooldown, // amount of ticks before allowed to shoot again (can shoot if 0)
            projectiles: this.projectiles,
            enemies: this.enemies,
            tick: this.tick,
            score: this.score
        }
    }

    turnRight() {
        if(this.playerMoveCooldown === 0){
            this.playerMoveCooldown = secondsToTicks(this.intervalBetweenPlayerMovement)
            this.playerTrack += 1
            if(this.playerTrack >= this.maxTracks) {
                this.playerTrack = 0
            }
        }
    }

    turnLeft() {
        if(this.playerMoveCooldown === 0){
            this.playerMoveCooldown = secondsToTicks(this.intervalBetweenPlayerMovement)
            this.playerTrack -= 1
            if(this.playerTrack < 0) {
                this.playerTrack = this.maxTracks - 1
            }
        }
    }

    shoot() {
        if(this.playerShotCooldown === 0) {
            this.playerShotCooldown = secondsToTicks(this.intervalBetweenShots)
            let newProjectile = {
                track: this.playerTrack,
                position: 0,
                id: 'projectile' + this.tick
            }
            this.projectiles.push(newProjectile)
        }
    }

    spawnEnemy(track, speed){
        let newEnemy = {
            position: 1,
            track,
            speed,
            id: 'enemy' + this.tick
        }
        this.enemies.push(newEnemy)
    }

    _gameTick() {
        if(this.playerShotCooldown > 0){
            this.playerShotCooldown -= 1
        }

        if(this.playerMoveCooldown > 0){
            this.playerMoveCooldown -= 1
        }

        let speed = this.projectileSpeed

        this.projectiles = this.projectiles.map(
            function(projectile){
                projectile.position += speed
                return projectile
            }
        )
        this.enemies = this.enemies.map(
            function(enemy){
                enemy.position -= enemy.speed
                return enemy
            }
        )

        this.projectiles = this.projectiles.filter(
            (projectile) => {
                // removes both the enemy and the projectile if there is a collision
                let enemyHit = this.enemies.filter(e => e.track === projectile.track)
                    .find(enemy => enemy.position <= projectile.position)
                if(enemyHit) {
                    this.enemies = this.enemies.filter(e => e.id !== enemyHit.id)
                    this.score += 1
                    return false
                }

                return projectile.position <= 1
            }
        )

        let lives = this.playerLives
        this.enemies = this.enemies.filter(
            function(enemy){
                if(enemy.position > 0) return true
                lives -= 1
                if(lives < 0) lives = 0
                return false
            }
        )
        this.playerLives = lives
        this.tick += 1
    }
}

const randomBetween = (min, max) => {
    return Math.round(min + (Math.random() * (max - min)))
}

const MIN_DIFFICULTY = [[25,75], [3, 6]]
const MAX_DIFFICULTY = [[10,30], [1.4, 2.8]]
const SCORE_FOR_HARDEST = 75

const nextParameters = (currentScore) => {
    const diffModifier = Math.max(SCORE_FOR_HARDEST - currentScore, 0)/SCORE_FOR_HARDEST
    let p1 = MAX_DIFFICULTY[0][0] + diffModifier * (MIN_DIFFICULTY[0][0] - MAX_DIFFICULTY[0][0])
    let p2 = MAX_DIFFICULTY[0][1] + diffModifier * (MIN_DIFFICULTY[0][1] - MAX_DIFFICULTY[0][1])
    let p3 = MAX_DIFFICULTY[1][0] + diffModifier * (MIN_DIFFICULTY[1][0] - MAX_DIFFICULTY[1][0])
    let p4 = MAX_DIFFICULTY[1][1] + diffModifier * (MIN_DIFFICULTY[1][1] - MAX_DIFFICULTY[1][1])

    return [[p1, p2], [p3, p4]]
}

const HighOrderGame = () => {
    let game = new Game()
    let interval = null
    let spawnCounter = 0

    let params = nextParameters(game.score)
    let nextSpawn = randomBetween(params[0][0], params[0][1])
    let nextTrack = randomBetween(0, game.maxTracks - 1)
    let nextSpeed = 1 / secondsToTicks(randomBetween(params[1][0], params[1][1]))

    const handler = () => {
        game._gameTick()
        if(game.playerLives <= 0) {
            return clearInterval(interval)
        }
        if(game.tick === nextSpawn) {
            game.spawnEnemy(nextTrack, nextSpeed)
            params = nextParameters(game.score)
            nextSpawn += randomBetween(params[0][0], params[0][1])
            nextTrack = randomBetween(0, game.maxTracks - 1)
            nextSpeed = 1 / secondsToTicks(randomBetween(params[1][0], params[1][1]))
        }
    }
    game.start = _ => {
        interval = setInterval(handler, 1000 / TICKS_PER_SECOND)
    }
    return game
}

module.exports = Game
module.exports.HigherOrder = HighOrderGame
