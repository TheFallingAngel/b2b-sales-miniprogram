#!/bin/bash
# 从Windows同步前端代码回WSL的脚本

SOURCE="/mnt/c/miniprogram"
TARGET="/home/zz/code1/miniprogram"

echo "正在从Windows同步前端代码..."
rsync -av --delete $SOURCE/ $TARGET/
echo "同步完成！现在Claude Code可以访问最新的前端代码了"