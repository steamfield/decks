# A private ZDOTDIR and zsh -d keep personal and global rc files off the projector.
PROMPT_EOL_MARK=''
PROMPT=$'\n%{\e]133;A\a%}%B%F{green}\$ %f%b'
zle_highlight=(default:fg=green,bold)
