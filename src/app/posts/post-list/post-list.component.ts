import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Post}  from '../post.model'
import { PostService } from '../post.service';
import { PageEvent } from '@angular/material/paginator';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
    selector: 'app-post-list',
    templateUrl: './post-list.component.html',
    styleUrls: ['./post-list.component.css']
})
export class PostListComponent implements OnInit, OnDestroy {
    isLoading=false;
    posts: Post[] = [];
    userIsAuthenticated = false;
    userId: string;
    private postsSub: Subscription;
    private authStatusSub: Subscription;
    currentPage = 1;
    totalPosts = 0;
    postsPerPage = 5;
    pageSizeOptions = [1,2,5,10];
    constructor(public postServices: PostService, private authService: AuthService){

    }

    ngOnInit(){
        this.isLoading = true;
        
        this.postServices.getPosts(this.postsPerPage, this.currentPage);
        this.userId = this.authService.getUserId();
        this.postsSub = this.postServices.getPostUpdateListener()
        .subscribe((postData: {posts: Post[], postCount: number})=>{
            this.isLoading = false;
            this.totalPosts = postData.postCount;
            this.posts = postData.posts; 
        });
       
        this.userIsAuthenticated = this.authService.getIsAuth();
        this.authStatusSub = this.authService
            .getAuthStatusListener()
            .subscribe(isAuthenticated =>{
                this.userIsAuthenticated = isAuthenticated;
                this.userId = this.authService.getUserId();
        });
        
    }
   
    onChangePage(pageData: PageEvent){
        this.isLoading = true;
        this.currentPage = pageData.pageIndex + 1;
        this.postsPerPage = pageData.pageSize;
        this.postServices.getPosts(this.postsPerPage, this.currentPage)

    }

    onDelete(postId: string){
        this.isLoading = true;
        this.postServices.deletePost(postId).subscribe(()=>{
            this.postServices.getPosts(this.postsPerPage, this.currentPage);
        }, () => {
            this.isLoading = false;
        });
    }

    ngOnDestroy(){
        this.postsSub.unsubscribe();
        this.authStatusSub.unsubscribe();
    }

    onDownload(post: Post) {
        console.log(post);
        this.postServices.downloadFile(post.filePath);
    }
}