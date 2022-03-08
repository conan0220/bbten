const canvas = document.getElementById('mycanvas')
const c = canvas.getContext('2d')

canvas.height = window.innerHeight
canvas.width = window.innerWidth

let counter = {
    p: 0,   // 控制初始化Player次數
    u: 1,   // 控制發射後不可再次發射 直到全部球回來 1 = 全部球回來 0 = 全部球還沒回來
    t: 0   // t = 已發射球的數量
}

let animate = {
    main: true,
    ball_explode: false,
    Player_lose_point: false,
    game_over: false
}

function createImage(src) {
    const image = new Image()
    image.src = src
    return image
}

function loadAudio(src) {
    const audio = document.createElement("audio")
     audio.src = src
     return audio
}

const audios = {
    ball_hit_brick: loadAudio("audio/GDYN_Punching_Perc_RAW_SH - 1.wav"),
    ball_hit_funtball: loadAudio("audio/ball_hit_funtball.mp3")

    /*
    ball_hit_brick: new Howl({ src: ["audio/ball_hit_brick.mp3"], loop: false, volume: 0.5, onend: function() {
        this.currentSrc = null
        this.src = ""
        this.srcObject = null
        //this.remove()
    } }),
    ball_hit_funtball: new Howl({ src: ["audio/ball_hit_funtball.mp3"], loop: false, volume: 0.02 })
    */
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
    static last_position_x = 0  // x = 發射時Player原本的位置
    static last_position_y = 0  // y = 發射時Player原本的位置

    constructor({ mouse_event, color = 'white', image, arrowhead, radius }) {
        this.mouse_event = mouse_event
        this.radius = 10
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
    static amount = 0
    static add_amount = false
    static add_amount_time = 30
    static ball_ball_distance = 30
    static all_launch = false
    static first_ball_arrive = true

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
                    ball.radius = 10
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
            circleCollidesWithRectangleBoundaryBounce({
                circle: {
                    ...this
                }})

            // 碰撞方塊檢測
            bricks.forEach((brick) => {
                if (circleCollidesWithRectangleBrickBounce({
                    circle: {
                        ...this
                    },
                    rectangle: {
                        ...brick
                    }
                })) {
                    audios.ball_hit_brick.cloneNode().volume = 1
                    audios.ball_hit_brick.cloneNode().play()
                    
                    brick.collide = true
                    brick.remain -= 1                       // brick減一
                    if (brick.remain <= 0) {                // brick規零
                        brick.exist = false
                    }
                    
                }
            })

            // ball碰撞funtball檢測
            funtballs.forEach((funtball) => {
                if (circleCollidesWithCircle({
                    circle_a: {
                        ...this
                    },
                    circle_b: {
                        ...funtball
                    }
                })) {
                    audios.ball_hit_funtball.volume = 0.3
                    audios.ball_hit_funtball.play()
                    
                    funtball.exist = false
                    Ball.add_amount = true
                }
            })
            

            // 碰撞底線
            if (circleCollidesWithDeadlineRectangle({
                circle: {
                    ...this
                }})) {
    
                if (Ball.first_ball_arrive) {                       // 第一顆落地
                    Player.position_x = this.position.x
                    Player.position_y = boundaries[(map.length - 1) * map[0].length + 1].position.y - this.radius - 1
                    //this.position.x = Player.position_x
                    //this.position.y = Player.position_y
                    this.next_position.x = Player.position_x
                    this.next_position.y = Player.position_y
                    Ball.first_ball_arrive = false
                    this.launch = false
                    console.log(Ball.all_launch)
                } else {                                               // 其他球落地
                    /*this.next_position.x = Player.position_x
                    this.next_position.y = Player.position_y
                    this.launch = false*/
                    this.velocity.x = 0
                    this.velocity.y = 0
                    if (Player.position_x - 1 <= this.position.x && this.position.x <= Player.position_x + 1) {
                        //this.position.x = Player.position_x
                        this.next_position.x = Player.position_x
                        //this.position.y = Player.position_y
                        this.next_position.y = Player.position_y
                        this.launch = false
                    }
                    else if (Player.position_x > this.position.x) {
                        //this.position.x += 0.5
                        this.next_position.x += 0.8
                    }
                    else if (Player.position_x < this.position.x) {
                        //this.position.x -= 0.5
                        this.next_position.x -= 0.8
                    }
                }
            }
                

            this.position.x = this.next_position.x
            this.position.y = this.next_position.y
            
        }
    }
}

class Boundary {
    static width = 70
    static height = 70
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
    static action_length = Brick.height
    static level = 35

    constructor({ position, next_position, image, color, bkcolor = 'black', velocity, exist, remain, action, ori_level, collide }) {
        this.position = position
        this.next_position = next_position
        this.image = image
        this.color = color
        this.bkcolor = bkcolor
        this.velocity = velocity
        this.exist = exist
        this.remain = remain
        this.action = action
        this.ori_level = ori_level
        this.collide = collide
    }

    draw() {
        c.beginPath()
        switch (this.image) {
            case 1:                       // 方形
                c.strokeStyle = 'rgba('+this.color.r+', '+this.color.g+', '+this.color.b+', '+this.color.a+')'   // 由數字決定
                c.lineWidth = String(Brick.stick_width)
                c.rect(this.position.x + Brick.stick_interval, this.position.y + Brick.stick_interval, Brick.width - 2 * Brick.stick_interval, Brick.height - 2 * Brick.stick_interval)
                
                c.stroke()
                c.textAlign = 'center'
                c.font = '18px Arial Black'
                c.fillStyle = 'rgba('+this.color.r+', '+this.color.g+', '+this.color.b+', '+this.color.a+')'
                c.fillText(this.remain, this.position.x + Brick.width / 2, this.position.y + Brick.height / 2 + Brick.stick_width)
        }

        c.closePath()
    }
    
    update(i) {
        if (this.action) {                                      // 往下一格
            this.position.y += this.velocity.y
            if (this.position.y === this.next_position.y + Brick.action_length) {
                this.next_position.y = this.position.y
                this.action = false                             // 已往下到下一格
                for (let i = 0; i < boundaries.length; i++) {                   // 碰到最底
                    if (this.position.y === boundaries[i].position.y - Boundary.width && boundaries[i].image === 'o') {
                         animate.Player_lose_point = true
                         animate.main = false
                         //console.log("lose")
                         break
                    }
                }
                
                if (this.remain !== Brick.level) {
                    if (5 <= this.ori_level && this.ori_level <= 99) {
                        this.color.g += 255 * (10 / 100)
                    }
                    else if (this.ori_level >= 100) {
                        if (this.color.b >= 0) {
                            this.color.b -= 255 * (20 / 100)
                        }               
                        else if (this.color.b <= 0) {
                            this.color.g += 255 * (20 / 100)
                        }
                    }
                }
                
            }
        }
        this.color.a = 1
        
        if (this.collide) {
            if (5 <= this.ori_level && this.ori_level <= 99) {
                this.color.g += 255 / this.ori_level 
            }
            else if (this.ori_level >= 100) {
                if (this.color.b >= 0) {
                    this.color.b -= (255 * 2) / this.ori_level
                }               
                else if (this.color.b <= 0) {
                    this.color.g += (255 * 2) / this.ori_level
                }
                
            }
            this.color.a = 0.5
            this.collide = false
        }

        if (!this.exist) {
            bricks.splice(i, 1)
        }
    }
}

class Funtball {
    static action_length = Brick.height
    static amount = 1

    constructor ({ position, next_position, image, color, velocity, exist, action, collide, radius }) {
        this.position = position
        this.next_position = next_position
        this.image = image
        this.color = color
        this.velocity = velocity
        this.exist = exist
        this.action = action
        this.collide = collide
        this.radius = radius
    }

    draw() {
        c.beginPath()
        switch (this.image) {
            case 1:                                          // 治療球
                this.radius = 13
                c.strokeStyle = 'white'
                c.lineWidth = 3.5
                c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2)
                c.stroke()
                c.closePath()

                c.beginPath()
                c.strokeStyle = 'rgb(255, 34, 34)' 
                c.lineWidth = 3
                c.moveTo(this.position.x - this.radius + 2*c.lineWidth, this.position.y)
                c.lineTo(this.position.x + this.radius - 2*c.lineWidth, this.position.y)
                c.moveTo(this.position.x, this.position.y - this.radius + 2*c.lineWidth)
                c.lineTo(this.position.x, this.position.y + this.radius - 2*c.lineWidth)
                c.stroke()

                break
        }

        c.closePath()
    }

    update(i) {
        if (this.action) {                                      // 往下一格
            this.position.y += this.velocity.y
            if (this.position.y === this.next_position.y + Funtball.action_length) {
                this.next_position.y = this.position.y
                this.action = false
            }
        }    

        if (!this.exist) {
            funtballs.splice(i, 1)
        }
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

const funtballs = []

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
                    boundaries.push(new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: ' '
                    }))
                    break
            }
        })
    })
}
readMap()                                                                           // 讀取地圖

// 讀取初始玩家位置 讀取初始球數量
if (counter.p === 0) {
    counter.p = 1
    Player.position_x = boundaries[(map[0].length - 1) / 2].position.x + (Boundary.width / 2)
    Player.position_y = boundaries[(map.length - 1) * (map[0].length)].position.y - player.radius - 1
    
}

window.addEventListener('mousemove', (event) => {                                   // 取得滑鼠座標
    player.mouse_event.x = event.pageX
    player.mouse_event.y = event.pageY
    //console.log(player.mouse_event.x, player.mouse_event.y)
})

window.addEventListener('mousedown', (event) => {                                   // 滑鼠按下
    if (!Ball.all_launch && bricks.every(brick => !brick.action)) {
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
    if (!Ball.all_launch && bricks.every(brick => !brick.action)) {
        switch (event.button) {
            case 0:
                console.log('left mouse up')
                player.mouse_event.up = true
                player.mouse_event.down = false
                Ball.all_launch = true
                Ball.first_ball_arrive = true
                counter.u = 1
                break
        }
    }
    
})
        

function circleCollidesWithRectangleBoundaryBounce({ circle, rectangle }) {                       // 圓形方形碰撞回彈
    if (circle.next_position.x - circle.radius <= boundaries[0].position.x + Boundary.width) {
        circle.velocity.x = -circle.velocity.x
        circle.next_position.x = boundaries[0].position.x + Boundary.width + circle.radius + 1
        return true
    }
    else if (circle.next_position.x + circle.radius >= boundaries[map[0].length - 1].position.x) {
        circle.velocity.x = -circle.velocity.x
        circle.next_position.x = boundaries[map[0].length - 1].position.x - circle.radius - 1
        return true
    }
    else if (circle.next_position.y - circle.radius <= boundaries[0].position.y + Boundary.height) {
        circle.velocity.y = -circle.velocity.y
        circle.next_position.y = boundaries[0].position.y + Boundary.height + circle.radius + 1
    }
}

function circleCollidesWithRectangleBrickBounce({ circle, rectangle }) {                       // 圓形方形碰撞回彈

    if (circle.next_position.x > rectangle.position.x && circle.next_position.x < rectangle.position.x + Brick.width && circle.next_position.y - circle.radius < rectangle.position.y + Brick.height && circle.next_position.y - circle.radius > rectangle.position.y) {       // 球上邊緣 碰到 方塊下邊緣
        circle.velocity.y = -circle.velocity.y
        circle.next_position.y = rectangle.position.y + Brick.height + circle.radius 
        return true  
    }
    else if (circle.next_position.x - circle.radius > rectangle.position.x && circle.next_position.x - circle.radius < rectangle.position.x + Brick.width && circle.next_position.y > rectangle.position.y  && circle.next_position.y < rectangle.position.y + Brick.height) {          // 球左邊緣 碰到 方塊右邊緣
        circle.velocity.x = -circle.velocity.x
        circle.next_position.x = rectangle.position.x + Brick.width + circle.radius 
        return true
    }
    else if (circle.next_position.x + circle.radius > rectangle.position.x && circle.next_position.x + circle.radius < rectangle.position.x + Brick.width && circle.next_position.y > rectangle.position.y && circle.next_position.y < rectangle.position.y + Brick.height) {            // 球右邊緣 碰到 方塊左邊緣
        circle.velocity.x = -circle.velocity.x
        circle.next_position.x = rectangle.position.x - circle.radius 
        return true
    }
    else if (circle.next_position.x > rectangle.position.x && circle.next_position.x < rectangle.position.x + Brick.width && circle.next_position.y + circle.radius < rectangle.position.y + Brick.height && circle.next_position.y + circle.radius > rectangle.position.y) {       // 球下邊緣 碰到 方塊上邊緣
        circle.velocity.y = -circle.velocity.y
        circle.next_position.y = rectangle.position.y - circle.radius
        return true
    }
}

function circleCollidesWithDeadlineRectangle({ circle }) {
    if (circle.next_position.y + circle.radius >= boundaries[(map.length - 1) * map[0].length + 1].position.y) {
        return true
    }
}

function circleCollidesWithCircle({ circle_a, circle_b }) {
    let h = Math.hypot(circle_a.next_position.x - circle_b.next_position.x, circle_a.next_position.y - circle_b.next_position.y)

    if (h < circle_a.radius + circle_b.radius) {
        return true
    }
}

function drawSurface() {
    
    if (!Ball.all_launch) {
        Player.next_position_x = Player.position_x
        Player.next_position_y = Player.position_y
    }

    // 畫出球數
    if (Ball.amount - counter.t != 0) {
        c.beginPath()
        c.textAlign = 'center'
        c.font = '15px Arial Black'
        c.fillStyle = 'white'
        c.fillText('x' + (Ball.amount - counter.t), Player.next_position_x, Player.next_position_y - player.radius - 10)
        c.closePath()
    }

    // 畫出level
    c.beginPath()
    c.textAlign = 'center'
    c.font = '40px Arial Black'
    c.fillStyle = 'white'
    c.fillText(Brick.level, boundaries[(map[0].length - 1) / 2].position.x + Boundary.width / 2, boundaries[0].position.y + Boundary.height / 1.5 )
    c.closePath()
}

function ballAddAmount() {
    if (Ball.add_amount) {                                                        // 球加一
        Ball.add_amount_time++
        Ball.add_amount = false
    }
}

function mouseUp() {
    if (player.mouse_event.up) {                                                // 放開滑鼠
        balls[0].launch = true                                                  // 第一顆球發射 
        player.mouse_event.up = false
        player.image = 1                                                        // Player變回第一張圖
        
        // 更新球的最初velocity
        balls.forEach((ball) => {
            if (player.arrowhead.slope > 0) {
                ball.velocity.x = 0.5 / Math.sqrt(1 + Math.pow(player.arrowhead.slope, 2))
            }
            else {
                ball.velocity.x = -(0.5 / Math.sqrt(1 + Math.pow(player.arrowhead.slope, 2)))
            }
            ball.velocity.y = ball.velocity.x * player.arrowhead.slope
            ball.image = 1
        })
    }
}

function ballsLaunch() {
    // update ball 管理每個球的移動 碰撞 全部球回來與否 改變Player位置
    for (let i = 0 + counter.t; i < Ball.amount; i++) {                                           // 發射完將不再發射              
        if (i > 0) {
            if (Math.hypot(balls[i - 1].position.x - balls[i].position.x, balls[i - 1].position.y - balls[i].position.y) > balls[i - 1].radius + balls[i].radius + Ball.ball_ball_distance) {
                balls[i].launch = true
                counter.t++                                                                     // t = 已發射球的數量
            }
        }
    }
}

function allBallBack(){
    if (balls.every(ball => !ball.launch) && counter.u === 1) {                                           // 全部球回來
        counter.u = 0
        counter.t = 0
        Ball.all_launch = false
        bricks.forEach((brick) => {
            brick.action = true                                                         // bricks往下
        })
        funtballs.forEach((funtball) => {
            funtball.action = true
        })
        Brick.level++
                                                                
        for (let q = 0; q < Ball.add_amount_time; q++) {                    // 球加一
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
                    distance: 12
                },
                launch: false,
            }))
            Ball.amount++
                
        }
        Ball.add_amount_time = 0
        

        for (let i = 0; i < getRandomInt(2, 7); i++) {                                        // 新增一行磚塊
            bricks.push(new Brick({
                position: {
                    x: boundaries[getRandomInt(1, (map[0].length - 1))].position.x,         // map第二行的其中一個位置
                    y: boundaries[(map[0].length - 1) + 1].position.y
                },
                next_position: {
                    x: 0,
                    y: 0
                },
                velocity: {
                    x: 0,
                    y: 2
                },
                color: {
                    r: 0,
                    g: 0,
                    b: 0,
                    a: 1
                },
                action: true,
                exist: true,
                image: 1,
                remain: Brick.level,
                ori_level: Brick.level
            }))
            if (bricks.length > 1) {
                for (let j = (bricks.length - 1) - i; j < bricks.length - 1; j++) {
                    let brick = bricks[j]
                    if (bricks[bricks.length - 1].position.x === brick.position.x) {
                        bricks[bricks.length - 1].position.x = boundaries[getRandomInt(1, (map[0].length - 1))].position.x
                        j = (bricks.length - 1) - i - 1
                    }
                }
            }
            
            bricks[bricks.length - 1].next_position.x = bricks[bricks.length - 1].position.x
            bricks[bricks.length - 1].next_position.y = bricks[bricks.length - 1].position.y
            
            if (0 <= bricks[bricks.length - 1].ori_level && bricks[bricks.length - 1].ori_level <= 4) {
                bricks[bricks.length - 1].color.r = 255
                bricks[bricks.length - 1].color.g = 255
                bricks[bricks.length - 1].color.b = 0
                bricks[bricks.length - 1].color.a = 1
            }
            else if (5 <= bricks[bricks.length - 1].ori_level && bricks[bricks.length - 1].ori_level <= 99) {
                bricks[bricks.length - 1].color.r = 255
                bricks[bricks.length - 1].color.g = 0
                bricks[bricks.length - 1].color.b = 0
                bricks[bricks.length - 1].color.a = 1
            }
            else if (100 <= bricks[bricks.length - 1].ori_level) {
                bricks[bricks.length - 1].color.r = 255
                bricks[bricks.length - 1].color.g = 0
                bricks[bricks.length - 1].color.b = 255
                bricks[bricks.length - 1].color.a = 1
            }
            console.log(bricks[bricks.length - 1].position.x)
        }

        let odds = 1
        if (odds === getRandomInt(1, 3)) {               // 1/2 的機率產生funtball
            for (let i = 0; i < 1; i++) {               // 讀取funtball數量
                funtballs.push(new Funtball({
                    position: {
                        x: boundaries[getRandomInt(1, (map[0].length - 1))].position.x  + Brick.width / 2, // map第二行的其中一個位置
                        y: boundaries[(map[0].length - 1) + 1].position.y  + Boundary.height / 2
                    },
                    next_position: {
                        x: 0,
                        y: 0
                    },
                    velocity: {
                        x: 0,
                        y: 2
                    },
                    exist: true,
                    action: true,
                    collide: false,
                    image: 1
                    
                }))
                let brick_amount = 0                // 新增一排brick的數量
                bricks.forEach((brick) => {
                    if (brick.position.y === bricks[bricks.length - 1].position.y) {
                        brick_amount++
                    }
                })
                for (let j = bricks.length - 1; j > bricks.length - brick_amount - 1; j--) {
                    const brick = bricks[j]
                    if (brick.position.x === funtballs[funtballs.length - 1].position.x - Brick.width / 2) {
                        funtballs[funtballs.length - 1].position.x = boundaries[getRandomInt(1, (map[0].length - 1))].position.x + Brick.width / 2
                        j = (bricks.length - 1) + 1
                        
                    }
                }
            }
        }

        funtballs.forEach((funtball) => {
            funtball.next_position.x = funtball.position.x
            funtball.next_position.y = funtball.position.y
        })
    }
}

function animatePlayerLosePoint() {
    
}

function mainControl() {
    ballAddAmount()

    mouseUp()

    ballsLaunch()

    allBallBack()

}

function mainUpdate() {
    boundaries.forEach((boundary) => {                                                 // update map
        if (boundary !== ' ')    
            boundary.update()                                                             
    })

    

    for (let i = 0; i < Ball.amount; i++) {
        for (let j = 0; j < balls[i].velocity.distance * 2; j++){
            if (balls[i].update()) {
                break
            }
        }
    }

    bricks.forEach((brick, i) => {                                                 // update bricks
        brick.update(i)                    
    })

    funtballs.forEach((funtball, i) => {
        funtball.update(i)
    })

    player.update()                                                                   // update player
    
}

function mainDraw() {
    c.clearRect(0, 0, canvas.width, canvas.height,)
    
    boundaries.forEach((boundary) => {                                                 // draw map
        if (boundary !== ' ')    
            boundary.draw()                                                             
    })

    bricks.forEach((brick) => {
        brick.draw()
    })

    balls.forEach((ball) => {
        if (ball.launch) {
            ball.draw()
        }
    })

    funtballs.forEach((funtball) => {
        funtball.draw()
    })

    player.draw()

    drawSurface()                                                                      // 畫層級、剩餘球數...
    
}

function loop() {                                                             
    window.requestAnimationFrame(loop)                                          
    if (animate.main) {
        mainControl()

        mainUpdate()

        mainDraw()
    }
    else if (animate.Player_lose_point) {
        animatePlayerLosePoint()
    }

}

loop()
