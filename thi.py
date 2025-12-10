# def simple_text_editor():
#     S = ""
#     history_stack = []

#     # Đọc số lượng thao tác Q
#     try:
#         Q = int(input()) 
#     except (ValueError, EOFError):
#         return

#     for _ in range(Q):
#         # Đọc từng dòng lệnh
#         try:
#             line = input().split()
#         except EOFError:
#             break

#         t = int(line[0])

#         if t == 1: # APPEND
#             W = line[1]
#             history_stack.append((1, len(W)))
#             S += W

#         elif t == 2: # DELETE
#             k = int(line[1])
#             deleted_segment = S[-k:]
#             history_stack.append((2, deleted_segment))
#             S = S[:-k]

#         elif t == 3: # PRINT
#             k = int(line[1])
#             print(S[k-1])

#         elif t == 4: # UNDO
#             last_op, val = history_stack.pop()
#             if last_op == 1:
#                 # Undo append -> delete
#                 length_to_remove = val
#                 S = S[:-length_to_remove]
#             else:
#                 # Undo delete -> append
#                 string_to_restore = val
#                 S += string_to_restore


# if __name__ == "__main__":
#     simple_text_editor()



b = [1, 3 , 4, 5]

print (b[:-1])