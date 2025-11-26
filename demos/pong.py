import pygame
import sys
import math
import random

pygame.init()
WIDTH, HEIGHT = 900, 600
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Pong - Robin Toussaint (Bots vs Bots)")
clock = pygame.time.Clock()
FONT = pygame.font.Font(None, 36)
BIGFONT = pygame.font.Font(None, 56)

PADDLE_WIDTH, PADDLE_HEIGHT = 10, 120
BALL_SIZE = 16
BASE_BALL_SPEED = 7

left = pygame.Rect(40, (HEIGHT - PADDLE_HEIGHT) // 2, PADDLE_WIDTH, PADDLE_HEIGHT)
right = pygame.Rect(WIDTH - 40 - PADDLE_WIDTH, (HEIGHT - PADDLE_HEIGHT) // 2, PADDLE_WIDTH, PADDLE_HEIGHT)
ball = pygame.Rect((WIDTH - BALL_SIZE) // 2, (HEIGHT - BALL_SIZE) // 2, BALL_SIZE, BALL_SIZE)

vel_x, vel_y = BASE_BALL_SPEED, BASE_BALL_SPEED
score_left, score_right = 0, 0
WIN_SCORE = 7
running = True
paused = False


DIFFICULTIES = {
    'Easy':    {'paddle_speed': 5,  'reaction': 0.22, 'error': 40, 'ball_mult': 0.95},
    'Medium':  {'paddle_speed': 8,  'reaction': 0.12, 'error': 14, 'ball_mult': 1.00},
    'Hard':    {'paddle_speed': 12, 'reaction': 0.06, 'error': 6,  'ball_mult': 1.08},
    'Nightmare':{'paddle_speed': 20,'reaction': 0.00, 'error': 0,  'ball_mult': 1.18}
}

difficulty = 'Nightmare'

def reset_ball(direction=1):
    global ball, vel_x, vel_y
    ball.x = (WIDTH - BALL_SIZE) // 2
    ball.y = (HEIGHT - BALL_SIZE) // 2
    base = BASE_BALL_SPEED * DIFFICULTIES[difficulty]['ball_mult']
    vel_x = base * direction
    vel_y = base * (1 if random.random() < 0.5 else -1)

def draw():
    screen.fill((20, 20, 24))
    pygame.draw.rect(screen, (230, 230, 230), left)
    pygame.draw.rect(screen, (230, 230, 230), right)
    pygame.draw.ellipse(screen, (230, 230, 230), ball)
    pygame.draw.aaline(screen, (120, 120, 120), (WIDTH // 2, 0), (WIDTH // 2, HEIGHT))
    score_surf = FONT.render(f"{score_left}  —  {score_right}", True, (230, 230, 230))
    screen.blit(score_surf, ((WIDTH - score_surf.get_width()) // 2, 18))
    status = FONT.render(f"Difficulty: {difficulty}  |  P: pause  |  R: replay  |  ESC: quit", True, (180, 180, 180))
    screen.blit(status, (12, HEIGHT - 34))

def show_winner(text):
    overlay = BIGFONT.render(text, True, (255, 220, 80))
    sub = FONT.render("Appuyez sur R pour rejouer ou ESC pour quitter", True, (200, 200, 200))
    screen.blit(overlay, ((WIDTH - overlay.get_width()) // 2, HEIGHT // 2 - 40))
    screen.blit(sub, ((WIDTH - sub.get_width()) // 2, HEIGHT // 2 + 20))

def predict_ball_target(ball_rect, v_x, v_y, target_x):
    
    x = float(ball_rect.x)
    y = float(ball_rect.y)
    vx = float(v_x)
    vy = float(v_y)
   
    for _ in range(2000):
        x += vx
        y += vy
        
        if y <= 0:
            y = -y
            vy = -vy
        if y + BALL_SIZE >= HEIGHT:
            y = 2*(HEIGHT - BALL_SIZE) - y
            vy = -vy
       
        if vx < 0 and x <= target_x:
            return y + BALL_SIZE/2
        if vx > 0 and x + BALL_SIZE >= target_x:
            return y + BALL_SIZE/2
    return HEIGHT / 2

def ai_move(paddle, side, last_react, dt):
    
    params = DIFFICULTIES[difficulty]
    
    if pygame.time.get_ticks() - last_react[0] < params['reaction'] * 1000:
        return last_react[1]

    
    if side == 'left':
        target_x = left.right + 1
    else:
        target_x = right.left - BALL_SIZE - 1

    predicted = predict_ball_target(ball, vel_x, vel_y, target_x)
   
    error = params['error']
    predicted += random.uniform(-error, error)

    last_react[0] = pygame.time.get_ticks()
    last_react[1] = predicted
    return predicted

reset_ball(1)


left_react = [0, HEIGHT/2]
right_react = [0, HEIGHT/2]

while running:
    dt = clock.get_time() / 1000.0
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                running = False
            # Pause: touche P ou Espace
            if event.key == pygame.K_p or event.key == pygame.K_SPACE:
                paused = not paused
            if event.key == pygame.K_r and (score_left >= WIN_SCORE or score_right >= WIN_SCORE):
                score_left = 0
                score_right = 0
                reset_ball(1)

        if event.type == pygame.MOUSEBUTTONDOWN:
            mx, my = event.pos
            

    if not paused and score_left < WIN_SCORE and score_right < WIN_SCORE:
        ball.x += vel_x
        ball.y += vel_y

        if ball.top <= 0 or ball.bottom >= HEIGHT:
            vel_y = -vel_y

        
        if ball.colliderect(left):
            vel_x = abs(vel_x) * 1.03
            offset = (ball.centery - left.centery) / (PADDLE_HEIGHT / 2)
            vel_y = max(-25, min(25, BASE_BALL_SPEED * offset))
        if ball.colliderect(right):
            vel_x = -abs(vel_x) * 1.03
            offset = (ball.centery - right.centery) / (PADDLE_HEIGHT / 2)
            vel_y = max(-25, min(25, BASE_BALL_SPEED * offset))

        if ball.left <= 0:
            score_right += 1
            reset_ball(1)
        if ball.right >= WIDTH:
            score_left += 1
            reset_ball(-1)

       
        lpredict = ai_move(left, 'left', left_react, dt)
        rpredict = ai_move(right, 'right', right_react, dt)

        
        lp_speed = DIFFICULTIES[difficulty]['paddle_speed']
        rp_speed = DIFFICULTIES[difficulty]['paddle_speed']

        
        if left.centery < lpredict - 6:
            left.y += lp_speed
        elif left.centery > lpredict + 6:
            left.y -= lp_speed

        
        if right.centery < rpredict - 6:
            right.y += rp_speed
        elif right.centery > rpredict + 6:
            right.y -= rp_speed

        
        if left.top < 0:
            left.top = 0
        if left.bottom > HEIGHT:
            left.bottom = HEIGHT
        if right.top < 0:
            right.top = 0
        if right.bottom > HEIGHT:
            right.bottom = HEIGHT

    draw()

   
    if paused and score_left < WIN_SCORE and score_right < WIN_SCORE:
        pause_surf = BIGFONT.render("PAUSE", True, (255, 255, 255))
        screen.blit(pause_surf, ((WIDTH - pause_surf.get_width()) // 2, (HEIGHT - pause_surf.get_height()) // 2))

    if score_left >= WIN_SCORE:
        show_winner("Bot Gauche a gagné !")
    elif score_right >= WIN_SCORE:
        show_winner("Bot Droit a gagné !")

    pygame.display.flip()
    clock.tick(60)

pygame.quit()
sys.exit()
