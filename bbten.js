const canvas = document.getElementById('mycanvas')
const c = canvas.getContext('2d')

canvas.height = window.innerHeight
canvas.width = window.innerWidth

function createImage(src) {
    const image = new Image()
    image.src = src
    return image
}

function player_Slope({ p1, p2 }) {                            // 求箭頭斜率
    let m = (p1.position_y - p2.mouse_event.y) / (p2.mouse_event.x - p1.position_x)
    let Max_m = 0.2

    if (p2.mouse_event.x === p1.position_x)                     // 斜率不存在時
        return (255)
    if (p2.mouse_event.y >= p1.position_y) {
        if (m > 0)
            return (-Max_m)
        else if (m < 0)
            return (Max_m)
    }
    else if (Max_m > m && m > 0)
        return (Max_m)
    else if (-Max_m < m && m < 0)
        return (-Max_m)
    else 
        return (m)
}

function getRandomInt(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min) + min)            // The maximum is exclusive and the minimum is inclusive
}

class Player {
    static position_x = 0
    static position_y = 0

    constructor({ mouse_event, color = 'white', image, arrowhead }) {
        this.mouse_event = mouse_event
        this.radius = 8
        this.color = color
        this.image = image
        this.arrowhead = arrowhead
    }

    draw() {
        c.beginPath()

        switch (this.image) {
            case 1:                         // 第一張圖
                c.arc(Player.position_x, Player.position_y, this.radius, 0, Math.PI * 2)
                c.fillStyle = this.color
                c.fill()
                break
            case 2:                         // 第二張圖 (準備發射)
                c.arc(Player.position_x, Player.position_y, this.radius, 0, Math.PI * 2)
                c.fillStyle = this.color
                c.fill()

                // 箭頭 
                c.strokeStyle = 'white'
                c.lineWidth = 5
                c.moveTo(Player.position_x, Player.position_y)
                c.lineTo(this.arrowhead.x, this.arrowhead.y)
                c.stroke()
                c.fillStyle = 'black'
                c.fill()
                break
        }
        
        c.closePath()
    }

    update() {
        if (this.mouse_event.down) {
            this.image = 2
        }
        else if (this.mouse_event.up) {
            this.image = 1
        }
        
        this.arrowhead.slope = player_Slope({
            p1: Player,
            p2: player
        })
        if (player.arrowhead.slope > 0) {
            this.arrowhead.x = player.arrowhead.length / Math.sqrt(1 + Math.pow(this.arrowhead.slope, 2)) + Player.position_x
        }
        else {
            this.arrowhead.x = -(player.arrowhead.length / Math.sqrt(1 + Math.pow(this.arrowhead.slope, 2))) + Player.position_x
        }
        
        this.arrowhead.y = Player.position_y - (this.arrowhead.x - Player.position_x) * this.arrowhead.slope
        //console.log('slope: ' + this.arrowhead.slope)
        //console.log('arrowhead.x: ' + this.arrowhead.x)
        //console.log('arrowhead.y: ' + this.arrowhead.y)

        this.draw()
    }
}

class Ball {
    static amount = 10
    static add_amount = false
    static ball_ball_distance = 30
    static all_launch = false

    constructor({ position, next_position, velocity, image, color, radius, launch }) {
        this.position = position
        this.next_position = next_position
        this.velocity = velocity
        this.image = image
        this.color = color
        this.radius = radius
        this.launch = launch
    }

    draw() {
        c.beginPath()

        switch (this.image) {                                                       // 球類
            case 1:             // 小白球
                this.color = 'white'
                balls.forEach((ball) => {
                    ball.radius = 8
                })
                c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2)
                c.fillStyle = this.color
                c.fill()
                break
        }

        c.closePath()
    }

    update() {                                                      // 移動
        if (this.launch) {
            
            this.next_position.x += this.velocity.x
            this.next_position.y -= this.velocity.y

            // 碰撞牆壁檢測
            boundaries.forEach((boundary) => {
                if (boundary !== ' ') {
                    circleCollidesWithRectangleBounce({
                        circle: {
                            ...this
                        },
                        rectangle: {
                            ...boundary
                        }
                    })
                }
                
            })
             

            // 碰撞方塊檢測
            /* if (circleCollidesWithRectangle({
                circle: {
                    ...this
                },
                rectangle: 
            })) {
                // 方塊減一 
            } */

            // 碰撞底線
            boundaries.forEach((boundary) => {
                if (boundary.image === 'o') {
                    if (circleCollidesWithDeadlineRectangle({
                        circle: {
                            ...this
                        },
                        rectangle: {
                            ...boundary
                        }
                    })) {
                        
                        if (balls.every(ball => ball.launch === true)) {
                            console.log('yes')
                            Player.position_x = this.position.x
                            Player.position_y = boundary.position.y - this.radius - 1
                        }
                        this.launch = false
                        this.position.x = Player.position_x
                        this.position.y = Player.position_y
                        this.next_position.x = Player.position_x
                        this.next_position.y = Player.position_y
                    }
                }
            })

            this.position.x = this.next_position.x
            this.position.y = this.next_position.y
            
        }
    }
}

class Boundary {
    static width = 60
    static height = 60
    static stick_width = 10                                 // 邊界棍子寬
    static stick_height = Boundary.height                                // 邊界棍子高

    constructor({ position, image, color = 'blue', bkcolor = 'black'}) {
        this.position = position
        this.image = image
        this.color = color
        this.bkcolor = bkcolor
    }

    draw() {
        c.beginPath()
        //c.fillStyle = this.bkcolor
        //c.fillRect(this.position.x, this.position.y, Boundary.width, Boundary.height)
        switch (this.image) {
            case 'r':
                c.fillStyle = this.color
                c.fillRect(this.position.x + Boundary.width - Boundary.stick_width, this.position.y, Boundary.stick_width, Boundary.stick_height) 
                break
            case 'l':
                c.fillStyle = this.color
                c.fillRect(this.position.x, this.position.y, Boundary.stick_width, Boundary.stick_height)
                break
            case '_':
                c.fillStyle = this.color
                c.fillRect(this.position.x, this.position.y + Boundary.height - Boundary.stick_width, Boundary.stick_height, Boundary.stick_width)
                break
            case '-':
                c.fillStyle = this.color
                c.fillRect(this.position.x, this.position.y, Boundary.stick_height, Boundary.stick_width)
                break
            case 'a':
                c.fillStyle = this.color
                c.fillRect(this.position.x + Boundary.width - Boundary.stick_width, this.position.y + Boundary.height - Boundary.stick_width, Boundary.stick_width, Boundary.stick_width)
                break
            case 'b':
                c.fillStyle = this.color
                c.fillRect(this.position.x, this.position.y + Boundary.height - Boundary.stick_width, Boundary.stick_width, Boundary.stick_width)
                break
            case 'c':
                c.fillStyle = 'red'
                c.fillRect(this.position.x, this.position.y, Boundary.stick_width, Boundary.stick_width)
                break
            case 'd':
                c.fillStyle = 'red'
                c.fillRect(this.position.x + Boundary.width - Boundary.stick_width, this.position.y, Boundary.stick_width, Boundary.stick_width)
                break
            case 'o':
                c.fillStyle = 'red'
                c.fillRect(this.position.x, this.position.y, Boundary.stick_height, Boundary.stick_width)
        }
        c.closePath()
    }

    update() {
        this.draw()
    }
}

class Brick {
    static width = Boundary.width
    static height = Boundary.height
    static stick_width = Boundary.width / 10
    //static stick_height = 35
    static stick_interval = Brick.stick_width
    static amount = getRandomInt(1, 5)
    
    constructor({ position, image, color, bkcolor = 'black', velocity, exist}) {
        this.position = position
        this.image = image
        this.color = color
        this.bkcolor = bkcolor
        this.velocity = velocity
        this.exist = exist
    }

    draw() {
        c.beginPath()
        //c.fillStyle = this.bkcolor
        // c.rect(this.position.x, this.position.y, Brick.width, Brick.height)
        switch (this.image) {
            case 1:                       // 方形
                c.strokeStyle = 'yellow'    // 由數字決定
                c.lineWidth = String(Brick.stick_width)
                c.rect(this.position.x + Brick.stick_interval, this.position.y + Brick.stick_interval, Brick.width - 2 * Brick.stick_interval, Brick.height - 2 * Brick.stick_interval)
                c.stroke()
        }

        c.closePath()
    }
    
    update() {

        this.draw()
    }
}

const player = new Player({                                           // player 初始化
    mouse_event: {
        x: 0,
        y: 0,
        up: false,
        down: false
    },
    image: 1,
    arrowhead: {
        x: 0,
        y: 0,
        length: 50,
        slope: 0
    }
})

const boundaries = []

const balls = []

const bricks = []

const map = [
    ['a', '_', '_', '_', '_', '_', '_', '_', '_', '_', 'b'],
    ['r', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', 'l'],
    ['r', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', 'l'],
    ['r', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', 'l'],
    ['r', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', 'l'],
    ['r', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', 'l'],
    ['r', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', 'l'],
    ['r', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', 'l'],
    ['r', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', 'l'],
    ['r', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', 'l'],
    ['r', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', 'l'],
    ['r', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', 'l'],
    ['d', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'c']
]

function readMap() {
    map.forEach((row, i) => {                                           
        row.forEach((symbol, j) => {
            switch (symbol) {
                case 'r':
                    boundaries.push(new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: 'r'
                    }))
                    break
                case 'l':
                    boundaries.push(new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: 'l'
                    }))
                    break
                case '_':
                    boundaries.push(new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: '_'
                    }))
                    break
                case '-':
                    boundaries.push(new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: '-'
                    }))
                    break
                case 'a':
                    boundaries.push(new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: 'a'
                    }))
                    break
                case 'b':
                    boundaries.push(new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: 'b'
                    }))
                    break
                case 'c':
                    boundaries.push(new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: 'c'
                    }))
                    break
                case 'd':
                    boundaries.push(new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: 'd'
                    }))
                    break
                case 'o':
                    boundaries.push(new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: 'o'
                    }))
                    break
                case ' ':
                    boundaries.push(' ')
                    break
            }
        })
    })
}
readMap()                                                                           // 讀取地圖

// 讀取初始玩家位置 讀取初始球數量
let p = 0
if (p === 0) {
    p = 1
    Player.position_x = boundaries[(map[0].length - 1) / 2].position.x + (Boundary.width / 2)
    Player.position_y = boundaries[(map.length - 1) * (map[0].length)].position.y - player.radius - 1
    for (let i = 0; i < Ball.amount; i++) {                                             
        balls.push(new Ball({
            position: {
                x: Player.position_x,
                y: Player.position_y
            },
            next_position: {
                x: Player.position_x,
                y: Player.position_y
            },
            velocity: {
                x: 0,
                y: 0,
                distance: 10
            },
            launch: false
        }))
    }
}

for (let i = 0; i < Brick.amount; i++) {                                        // 讀取初始磚塊數量
    bricks.push(new Brick({
        position: {
            x: boundaries[getRandomInt(1, (map[0].length - 1))].position.x,         // map第二行的其中一個位置
            y: boundaries[(map[0].length - 1) + 1].position.y
        },
        velocity: {
            x: 0,
            y: 5
        },
        exist: true,
        image: 1
    }))
}


window.addEventListener('mousemove', (event) => {                                   // 取得滑鼠座標
    player.mouse_event.x = event.pageX
    player.mouse_event.y = event.pageY
    console.log(player.mouse_event.x, player.mouse_event.y)
})

window.addEventListener('mousedown', (event) => {                                   // 滑鼠按下
    if (!Ball.all_launch) {
        switch (event.button) {
            case 0:
                console.log('left mouse down')
                player.mouse_event.down = true
                player.mouse_event.up = false
                break
        }
    }
    
})

window.addEventListener('mouseup', (event) => {                                     // 滑鼠放開
    if (!Ball.all_launch) {
        switch (event.button) {
            case 0:
                console.log('left mouse up')
                player.mouse_event.up = true
                player.mouse_event.down = false
                Ball.all_launch = true
                break
        }
    }
    
})

function circleCollidesWithRectangleBounce({ circle, rectangle }) {                       // 圓形方形碰撞回彈
    
    if (circle.next_position.x + circle.radius > rectangle.position.x && circle.next_position.x + circle.radius < rectangle.position.x + Boundary.width && circle.next_position.y > rectangle.position.y && circle.next_position.y < rectangle.position.y + Boundary.height) {            // 球右邊緣 碰到 方塊左邊緣
        circle.velocity.x = -circle.velocity.x
        circle.next_position.x = rectangle.position.x - circle.radius - 1
        
    }
    else if (circle.next_position.x - circle.radius > rectangle.position.x && circle.next_position.x - circle.radius < rectangle.position.x + Boundary.width && circle.next_position.y > rectangle.position.y  && circle.next_position.y < rectangle.position.y + Boundary.height) {          // 球左邊緣 碰到 方塊右邊緣
        circle.velocity.x = -circle.velocity.x
        circle.next_position.x = rectangle.position.x + Boundary.width + circle.radius + 1
    }
    else if (circle.next_position.x > rectangle.position.x && circle.next_position.x < rectangle.position.x + Boundary.width && circle.next_position.y - circle.radius < rectangle.position.y + Boundary.height && circle.next_position.y - circle.radius > rectangle.position.y) {         // 球上邊緣 碰到 方塊下邊緣
        circle.velocity.y = -circle.velocity.y
        circle.next_position.y = rectangle.position.y + Boundary.height + circle.radius + 1
    }
    else if (circle.next_position.x > rectangle.position.x && circle.next_position.x < rectangle.position.x + Boundary.width && circle.next_position.y + circle.radius < rectangle.position.y + Boundary.height && circle.next_position.y + circle.radius > rectangle.position.y) {       // 球下邊緣 碰到 方塊上邊緣
        circle.velocity.y = -circle.velocity.y
        circle.next_position.y = rectangle.position.y - circle.radius
    }
}

function circleCollidesWithDeadlineRectangle({ circle, rectangle }) {
    if (circle.position.y + circle.radius >= rectangle.position.y) {
        return true
    }
}

    
function animate() {                                                                // loop
    window.requestAnimationFrame(animate)
    c.clearRect(0, 0, canvas.width, canvas.height,)

    // console.log(player.mouse_event.x, player.mouse_event.y)                   // 回傳滑鼠座標
    
    if (Ball.add_amount) {                                                        // 球加一
        balls.push(new Ball({
            position: {
                x: Player.position_x,
                y: Player.position_y
            },
            next_position: {
                x: Player.position_x,
                y: Player.position_y
            },
            velocity: {
                x: 0,
                y: 0,
                distance: 10
            },
            launch: false
        }))
        Ball.amount++
        Ball.add_amount = false  
    }


    if (player.mouse_event.up) {                                                // 放開滑鼠
        balls[0].launch = true                                                  // 第一顆球發射 
        player.mouse_event.up = false
        player.image = 1                                                        // Player變回第一張圖
        
        // 更新球的最初velocity
        balls.forEach((ball) => {
            if (player.arrowhead.slope > 0) {
                ball.velocity.x = ball.velocity.distance / Math.sqrt(1 + Math.pow(player.arrowhead.slope, 2))
            }
            else {
                ball.velocity.x = -(ball.velocity.distance / Math.sqrt(1 + Math.pow(player.arrowhead.slope, 2)))
            }
            ball.velocity.y = ball.velocity.x * player.arrowhead.slope
            ball.image = 1
        })

    }

    // update ball 管理每個球的移動 碰撞 全部球回來與否 改變Player位置
    for (let i = 0; i < Ball.amount; i++) {                                                         
        if (i > 0) {
            if (Math.hypot(balls[i - 1].position.x - balls[i].position.x, balls[i - 1].position.y - balls[i].position.y) > balls[i - 1].radius + balls[i].radius + Ball.ball_ball_distance) {
                balls[i].launch = true
            }
        }
        balls[i].update()
    }
    if (balls.every(ball => !ball.launch)) {                                           // 全部球回來
        Ball.all_launch = false
    }

    boundaries.forEach((boundary) => {                                                 // update map
        if (boundary !== ' ')    
            boundary.update()                                                             
    })

    bricks.forEach((brick) => {                                                 // update map
        brick.update()                                                             
    })
    
    balls.forEach((ball) => {
        if (ball.launch) {
            ball.draw()
        }
    })

    player.update()                                                                   // update player
}

animate()