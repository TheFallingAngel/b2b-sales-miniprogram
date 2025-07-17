#!/bin/bash
# 同步前端代码到Windows的脚本

SOURCE="/home/zz/code1/miniprogram"
TARGET="/mnt/c/miniprogram"

echo "正在同步前端代码到Windows..."
rsync -av --delete $SOURCE/ $TARGET/
echo "同步完成！Windows路径: C:\miniprogram"